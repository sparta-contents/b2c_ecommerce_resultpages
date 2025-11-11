import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  needsVerification: boolean;
  pendingGoogleUser: {
    email: string;
    name: string;
    profile_image?: string;
    google_id: string;
    user_id: string;
  } | null;
  clearVerificationState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<{
    email: string;
    name: string;
    profile_image?: string;
    google_id: string;
    user_id: string;
  } | null>(null);

  const fetchUserRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching user role:', error);
        }
        setUserRole('user');
        return;
      }

      const role = data?.role ?? 'user';
      setUserRole(role);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error in fetchUserRole:', err);
      }
      setUserRole('user');
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let loadingTimeout: NodeJS.Timeout | null = null;

    // Force loading to false after 1 second max (optimized)
    loadingTimeout = setTimeout(() => {
      if (mounted) {
        setLoading(false);
        setInitialLoadComplete(true);
      }
    }, 1000);

    // Get initial session (optimized)
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          if (import.meta.env.DEV) {
            console.error('세션 로드 에러:', error);
          }
          if (mounted) {
            setLoading(false);
            setInitialLoadComplete(true);
          }
          return;
        }

        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            // Use Promise.race to timeout after 500ms
            const rolePromise = supabase
              .from('users')
              .select('role')
              .eq('id', session.user.id)
              .single();

            const timeoutPromise = new Promise((resolve) =>
              setTimeout(() => resolve({ data: null, error: { message: 'timeout' } }), 500)
            );

            const { data: existingUser } = await Promise.race([rolePromise, timeoutPromise]) as any;

            if (existingUser) {
              setUserRole(existingUser.role || 'user');
            } else {
              setUserRole('user');
            }
          }
          setLoading(false);
          setInitialLoadComplete(true);
          if (loadingTimeout) clearTimeout(loadingTimeout);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('세션 초기화 에러:', err);
        }
        if (mounted) {
          setLoading(false);
          setInitialLoadComplete(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // SIGNED_OUT 이벤트 시 즉시 상태 초기화
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserRole(null);
        setNeedsVerification(false);
        setPendingGoogleUser(null);
        return;
      }

      setUser(session?.user ?? null);

      // Sync user data to our users table
      if (session?.user) {
        try {
          const queryPromise = supabase
            .from('users')
            .select('role, google_id, profile_image')
            .eq('id', session.user.id)
            .single();

          // Add timeout to prevent hanging (optimized to 1 second)
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout after 1 second')), 1000)
          );

          const { data: existingUser, error: queryError } = await Promise.race([
            queryPromise,
            timeoutPromise
          ]) as any;

          // PGRST116 = not found error (user not in users table)
          if (queryError && queryError.code === 'PGRST116') {
            // User not found - need verification
            const googleUserData = {
              email: session.user.email!,
              name: session.user.user_metadata.full_name || session.user.email!.split('@')[0],
              profile_image: session.user.user_metadata.avatar_url,
              google_id: session.user.user_metadata.sub || session.user.user_metadata.provider_id,
              user_id: session.user.id, // Include auth user ID
            };

            setPendingGoogleUser(googleUserData);
            setNeedsVerification(true);

            // Keep the Google session active - don't sign out
            // This allows us to create the user with proper RLS policies
          } else if (existingUser) {
            // Set state immediately for fast UI rendering
            setUserRole(existingUser.role || 'user');
            setNeedsVerification(false);
            setPendingGoogleUser(null);

            // Update google_id or profile_image in background (non-blocking)
            const updateData: any = {};
            if (!existingUser.google_id) {
              updateData.google_id = session.user.user_metadata.sub || session.user.user_metadata.provider_id;
            }
            if (!existingUser.profile_image && session.user.user_metadata.avatar_url) {
              updateData.profile_image = session.user.user_metadata.avatar_url;
            }

            if (Object.keys(updateData).length > 0) {
              // Fire and forget - update in background without blocking
              supabase.from('users')
                .update(updateData)
                .eq('id', session.user.id)
                .then(() => {
                  if (import.meta.env.DEV) {
                    console.log('프로필 정보 업데이트 완료');
                  }
                })
                .catch(err => {
                  if (import.meta.env.DEV) {
                    console.error('프로필 업데이트 실패:', err);
                  }
                });
            }
          } else if (queryError) {
            // 406 에러 등 다른 에러는 조용히 처리
            if (queryError.code !== '406' && import.meta.env.DEV) {
              console.error('쿼리 에러:', queryError);
            }
            setUserRole('user');
          } else {
            setUserRole('user');
          }
        } catch (err) {
          // Timeout 에러는 조용히 처리
          if (import.meta.env.DEV) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            if (!errorMessage.includes('timeout')) {
              console.error('사용자 데이터 동기화 중 에러:', err);
            }
          }
          setUserRole('user');
        }
      } else {
        setUserRole(null);
      }
    });

    return () => {
      mounted = false;
      if (loadingTimeout) clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        // Google's default behavior:
        // - Single account: auto-login
        // - Multiple accounts: show account selection
      },
    });
    if (error && import.meta.env.DEV) {
      console.error('Error signing in with Google:', error);
    }
  };

  const signOut = async () => {
    // Prevent duplicate logout calls
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      // Clear state
      setUser(null);
      setUserRole(null);
      setNeedsVerification(false);
      setPendingGoogleUser(null);

      // Call Supabase signOut
      const { error } = await supabase.auth.signOut({ scope: 'global' });

      if (error && import.meta.env.DEV) {
        console.error('Supabase signOut 에러:', error);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('로그아웃 중 에러:', err);
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const clearVerificationState = () => {
    setNeedsVerification(false);
    setPendingGoogleUser(null);
  };

  const isAdmin = userRole === 'admin';
  const isAuthenticated = !!user && !needsVerification;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      userRole,
      isAdmin,
      isAuthenticated,
      signInWithGoogle,
      signOut,
      needsVerification,
      pendingGoogleUser,
      clearVerificationState
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: string | null;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const fetchUserRole = useCallback(async (userId: string) => {
    console.log('fetchUserRole 호출됨, userId:', userId);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      console.log('fetchUserRole 결과 - data:', data, 'error:', error);

      if (error) {
        console.error('Error fetching user role:', error);
        setUserRole('user');
        return;
      }

      const role = data?.role ?? 'user';
      console.log('User role fetched:', role);
      setUserRole(role);
    } catch (err) {
      console.error('Error in fetchUserRole:', err);
      setUserRole('user');
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let loadingTimeout: NodeJS.Timeout | null = null;

    // Force loading to false after 1 second max (optimized)
    loadingTimeout = setTimeout(() => {
      console.log('강제 로딩 타임아웃 - 1초 경과');
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
          console.error('세션 로드 에러:', error);
          if (mounted) {
            setLoading(false);
            setInitialLoadComplete(true);
          }
          return;
        }

        console.log('초기 세션 로드됨:', session?.user?.id);

        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            console.log('초기 세션에서 사용자 데이터 확인');
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
          console.log('초기 로딩 완료');
          setLoading(false);
          setInitialLoadComplete(true);
          if (loadingTimeout) clearTimeout(loadingTimeout);
        }
      } catch (err) {
        console.error('세션 초기화 에러:', err);
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
      console.log('onAuthStateChange 호출됨, event:', event, 'user:', session?.user?.id);

      if (!mounted) return;

      setUser(session?.user ?? null);

      // Sync user data to our users table
      if (session?.user) {
        console.log('유저 세션 존재, 동기화 시작');

        // First: Ensure user exists in DB (가장 먼저 실행)
        console.log('1. 사용자 데이터 동기화 시작');
        try {
          console.log('1-1. existingUser 조회 시작');
          console.log('1-1-1. session.user.id:', session.user.id);
          console.log('1-1-2. Supabase URL:', supabase.supabaseUrl);

          const queryPromise = supabase
            .from('users')
            .select('id, google_id, role')
            .eq('id', session.user.id)
            .single();

          console.log('1-1-3. 쿼리 생성 완료, 실행 중...');

          // Add timeout to prevent hanging (optimized to 3 seconds)
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout after 3 seconds')), 3000)
          );

          const { data: existingUser, error: queryError } = await Promise.race([
            queryPromise,
            timeoutPromise
          ]) as any;

          console.log('1-2. existingUser 조회 결과:', existingUser, 'error:', queryError);

          // PGRST116 = not found error
          if (queryError && queryError.code === 'PGRST116') {
            console.log('1-3. 새 사용자 생성 중...');
            const userData = {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata.full_name || session.user.email!.split('@')[0],
              profile_image: session.user.user_metadata.avatar_url,
              google_id: session.user.user_metadata.sub || session.user.user_metadata.provider_id,
              role: 'user', // 기본 role
            };
            console.log('1-3-1. 생성할 데이터:', userData);

            const { data: newUser, error: insertError } = await supabase
              .from('users')
              .insert(userData)
              .select()
              .single();

            console.log('1-4. 새 사용자 생성 결과:', { newUser, insertError });

            if (insertError) {
              console.error('1-4-ERROR. 사용자 생성 실패:', insertError);
              console.error('1-4-ERROR-DETAIL:', JSON.stringify(insertError, null, 2));
              console.error('1-4-ERROR-MESSAGE:', insertError.message);
              console.error('1-4-ERROR-CODE:', insertError.code);
            }

            if (!insertError && newUser) {
              console.log('1-4-SUCCESS. 사용자 생성 성공, role:', newUser.role);
              setUserRole(newUser.role || 'user');
            } else {
              console.log('1-4-FALLBACK. 기본 role 설정');
              setUserRole('user');
            }
          } else if (existingUser) {
            console.log('1-3. 기존 사용자 확인됨, role:', existingUser.role);

            // Update google_id if missing
            if (!existingUser.google_id) {
              console.log('1-4. google_id 업데이트 중...');
              await supabase.from('users').update({
                google_id: session.user.user_metadata.sub || session.user.user_metadata.provider_id,
              }).eq('id', session.user.id);
            }

            setUserRole(existingUser.role || 'user');
          } else if (queryError) {
            console.error('1-3. 쿼리 에러 발생:', queryError);
            console.error('1-3-ERROR-MESSAGE:', queryError.message);
            console.error('1-3-ERROR-CODE:', queryError.code);
            console.error('1-3-ERROR-DETAIL:', JSON.stringify(queryError, null, 2));
            setUserRole('user');
          } else {
            console.error('1-3. 예상치 못한 상황: existingUser와 queryError 모두 없음');
            setUserRole('user');
          }
        } catch (err) {
          console.error('1-X. 사용자 데이터 동기화 중 에러:', err);
          console.error('1-X-DETAIL:', err instanceof Error ? err.message : String(err));
          console.error('1-X-STACK:', err instanceof Error ? err.stack : 'No stack trace');
          setUserRole('user'); // 기본값 설정
        }

        console.log('2. 사용자 동기화 완료');
      } else {
        console.log('유저 세션 없음, role null로 설정');
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
    if (error) console.error('Error signing in with Google:', error);
  };

  const signOut = async () => {
    // Prevent duplicate logout calls
    if (isLoggingOut) {
      console.log('이미 로그아웃 진행 중...');
      return;
    }

    setIsLoggingOut(true);
    console.log('로그아웃 시작...');

    try {
      // Clear state
      setUser(null);
      setUserRole(null);

      // Call Supabase signOut
      const { error } = await supabase.auth.signOut({ scope: 'global' });

      if (error) {
        console.error('Supabase signOut 에러:', error);
      } else {
        console.log('로그아웃 완료');
      }
    } catch (err) {
      console.error('로그아웃 중 에러:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isAdmin = userRole === 'admin';

  // Debug logging
  useEffect(() => {
    console.log('Auth state updated:', {
      userId: user?.id,
      userRole,
      isAdmin,
      loading
    });

    // Log when loading completes
    if (!loading && user) {
      console.log('인증 로딩 완료 - 사용자:', user.id, 'role:', userRole, 'isAdmin:', isAdmin);
    }
  }, [user, userRole, isAdmin, loading]);

  return (
    <AuthContext.Provider value={{ user, loading, userRole, isAdmin, signInWithGoogle, signOut }}>
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

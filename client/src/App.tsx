import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import UserVerificationModal from "@/components/UserVerificationModal";
import Home from "@/pages/home";
import Write from "@/pages/write";
import Admin from "@/pages/admin";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import { useToast } from "@/hooks/use-toast";
import { initGA, trackPageView } from "@/lib/analytics";
import { useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/write" component={Write} />
      <Route path="/admin" component={Admin} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { needsVerification, pendingGoogleUser, clearVerificationState, signOut } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();

  // GA4 초기화 (앱 시작 시 1회만)
  useEffect(() => {
    initGA();
  }, []);

  // 페이지 이동 추적
  useEffect(() => {
    trackPageView(location);
  }, [location]);

  const handleVerificationSuccess = () => {
    clearVerificationState();
    toast({
      title: "인증 완료",
      description: "회원가입이 완료되었습니다. 다시 로그인해주세요.",
    });
    // Reload to trigger login flow
    window.location.reload();
  };

  const handleVerificationClose = async () => {
    clearVerificationState();

    // Supabase 세션 삭제 (로그아웃 처리)
    await signOut();

    toast({
      title: "인증 취소",
      description: "회원가입이 취소되었습니다.",
      variant: "destructive",
    });
  };

  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <Toaster />
        <Router />
        {needsVerification && pendingGoogleUser && (
          <UserVerificationModal
            isOpen={needsVerification}
            onClose={handleVerificationClose}
            onSuccess={handleVerificationSuccess}
            googleUser={pendingGoogleUser}
          />
        )}
      </TooltipProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

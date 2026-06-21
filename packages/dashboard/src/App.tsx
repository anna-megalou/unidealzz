import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { LanguageProvider } from '@/hooks/useLanguage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import ScrollToTop from '@/components/ScrollToTop';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FcmTokenSync, NotificationListener, NotificationPrompt } from '@/components/notifications';
import ChatLauncher from '@/components/assistant/ChatLauncher';

import Login from '@/pages/Login';
import SignUp from '@/pages/SignUp';
import ResetPassword from '@/pages/ResetPassword';
import AcceptInvite from '@/pages/AcceptInvite';
import Operations from '@/pages/Operations';
import StudentHub from '@/pages/StudentHub';
import SavedDeals from '@/pages/student-hub/SavedDeals';
import Claimed from '@/pages/student-hub/Claimed';
import Purchases from '@/pages/student-hub/Purchases';
import Account from '@/pages/student-hub/Account';
import Support from '@/pages/student-hub/Support';
import Settings from '@/pages/student-hub/Settings';
import Experiences from '@/pages/student-hub/Experiences';

function AuthenticatedFcmComponents() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <>
      <NotificationListener />
      <FcmTokenSync />
    </>
  );
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />

        <Route path="/operations" element={<ProtectedRoute requireStaff><Operations /></ProtectedRoute>} />
        <Route path="/student-hub" element={<ProtectedRoute><StudentHub /></ProtectedRoute>} />
        <Route path="/student-hub/saved" element={<ProtectedRoute><SavedDeals /></ProtectedRoute>} />
        <Route path="/student-hub/claimed" element={<ProtectedRoute><Claimed /></ProtectedRoute>} />
        <Route path="/student-hub/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
        <Route path="/student-hub/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/student-hub/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
        <Route path="/student-hub/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/student-hub/experiences" element={<ProtectedRoute><Experiences /></ProtectedRoute>} />

        <Route path="/" element={<Navigate to="/student-hub" replace />} />
        <Route path="*" element={<Navigate to="/student-hub" replace />} />
      </Routes>
      <ChatLauncher />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <AppRoutes />
            <Toaster />
            <Sonner />
            <NotificationPrompt />
            <AuthenticatedFcmComponents />
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

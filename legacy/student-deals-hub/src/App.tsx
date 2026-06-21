import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Offers from "./pages/Offers";
import OfferDetail from "./pages/OfferDetail";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ResetPassword from "./pages/ResetPassword";
import AcceptInvite from "./pages/AcceptInvite";

import About from "./pages/About";
import Contact from "./pages/Contact";
import Operations from "./pages/Operations";
import StudentHub from "./pages/StudentHub";
import SavedDeals from "./pages/student-hub/SavedDeals";
import Claimed from "./pages/student-hub/Claimed";
import Purchases from "./pages/student-hub/Purchases";
import Account from "./pages/student-hub/Account";
import Support from "./pages/student-hub/Support";
import Settings from "./pages/student-hub/Settings";
import Experiences from "./pages/student-hub/Experiences";
import Premium from "./pages/Premium";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cookies from "./pages/Cookies";
import Unsubscribe from "./pages/Unsubscribe";
import NotFound from "./pages/NotFound";
import CookieConsent from "@/components/cookies/CookieConsent";
import ChatLauncher from "@/components/assistant/ChatLauncher";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/offers/:id" element={<OfferDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />

            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />

            <Route path="/operations" element={<ProtectedRoute requireStaff><Operations /></ProtectedRoute>} />
            <Route path="/student-hub" element={<ProtectedRoute><StudentHub /></ProtectedRoute>} />
            <Route path="/student-hub/saved" element={<ProtectedRoute><SavedDeals /></ProtectedRoute>} />
            <Route path="/student-hub/claimed" element={<ProtectedRoute><Claimed /></ProtectedRoute>} />
            <Route path="/student-hub/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
            <Route path="/student-hub/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
            <Route path="/student-hub/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
            <Route path="/student-hub/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/student-hub/experiences" element={<ProtectedRoute><Experiences /></ProtectedRoute>} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieConsent />
          <ChatLauncher />
        </BrowserRouter>
      </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

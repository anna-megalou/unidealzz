import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LanguageProvider } from '@/hooks/useLanguage';
import ScrollToTop from '@/components/ScrollToTop';
import Index from './pages/Index';
import Offers from './pages/Offers';
import OfferDetail from './pages/OfferDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Premium from './pages/Premium';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import Unsubscribe from './pages/Unsubscribe';
import NotFound from './pages/NotFound';
import CookieConsent from '@/components/cookies/CookieConsent';
import ChatLauncher from '@/components/assistant/ChatLauncher';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
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
  </QueryClientProvider>
);

export default App;

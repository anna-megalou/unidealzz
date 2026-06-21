import Navbar from "@/components/Navbar";
import HeroSection from "@/components/home/HeroSection";
import CategorySection from "@/components/home/CategorySection";
import StatsSection from "@/components/home/StatsSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import Footer from "@/components/home/Footer";
import GetPremiumPopup from "@/components/home/GetPremiumPopup";

const Index = () => {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(0deg, #FCF8FE, #FCF8FE), hsl(var(--background))" }}>
      <Navbar />
      <HeroSection />
      <CategorySection />
      <StatsSection />
      <HowItWorksSection />
      <Footer />
      <GetPremiumPopup />
    </div>
  );
};

export default Index;

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProblemStatement from "@/components/ProblemStatement";
import TheSolution from "@/components/TheSolution";
import RecognitionDemo from "@/components/RecognitionDemo";
import SlackFeedSection from "@/components/SlackFeedSection";
import BrandCatalogSection from "@/components/BrandCatalogSection";
import AnalyticsShowcase from "@/components/AnalyticsShowcase";
import ReviewCyclesSection from "@/components/ReviewCyclesSection";
import CelebrationsSection from "@/components/CelebrationsSection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <ProblemStatement />
        <TheSolution />
        <RecognitionDemo />
        <SlackFeedSection />
        <BrandCatalogSection />
        <AnalyticsShowcase />
        <ReviewCyclesSection />
        <CelebrationsSection />
        <PricingSection />
        <FAQSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

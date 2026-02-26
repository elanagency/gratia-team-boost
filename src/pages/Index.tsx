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
import Footer from "@/components/Footer";

const Index = () => {
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
      </main>
      <Footer />
    </div>
  );
};

export default Index;

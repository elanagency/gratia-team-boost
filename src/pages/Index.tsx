import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <div className="text-white" style={{ backgroundColor: '#0F0533' }}>
          <Features />
          <HowItWorks />
          <Pricing />
          <CTA />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;

import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProblemStatement from "@/components/ProblemStatement";
import TheSolution from "@/components/TheSolution";
import RecognitionDemo from "@/components/RecognitionDemo";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <ProblemStatement />
        <TheSolution />
        <RecognitionDemo />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

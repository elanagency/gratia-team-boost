
import { Button } from '@/components/ui/button';

const Hero = () => {
  return (
    <section className="relative py-20 px-4 overflow-hidden bg-black">
      {/* Background gradient effect */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-grattia-purple/30 via-black/95 to-black"></div>
      </div>
      
      {/* Glowing orb effects */}
      <div className="absolute top-32 right-10 w-64 h-64 rounded-full bg-grattia-pink/10 blur-3xl"></div>
      <div className="absolute bottom-32 left-10 w-96 h-96 rounded-full bg-grattia-purple/20 blur-3xl"></div>
      
      <div className="container mx-auto max-w-6xl relative z-10 pt-20 pb-16 text-center">
        <div className="animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6">
            Recognize & Reward
            <br />
            <span className="text-white">Your Team</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto mb-10">
            Build a culture of appreciation with instant peer recognition and meaningful rewards that make your team feel valued.
          </p>
          
          <Button className="grattia-button text-lg py-6 px-10">
            Get Started
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;

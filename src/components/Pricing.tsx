import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
const Pricing = () => {
  return <section id="pricing" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            No hidden fees, no complex tiers. Just $2.99 per employee per month.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          {/* Main Pricing Card */}
          <div className="feature-card border border-grattia-purple-light/20 rounded-2xl p-8 mb-8 text-center animate-scale-in">
            <h3 className="text-2xl font-bold text-white mb-6">One Simple Plan</h3>
            
            <div className="mb-8">
              <div className="text-5xl font-bold text-grattia-pink mb-2">$2.99</div>
              <div className="text-gray-300 text-lg">per employee per month</div>
              
            </div>

            <Button className="grattia-button text-lg py-6 px-10 mb-4">Signup</Button>
            
          </div>

          {/* Features Included */}
          
        </div>
      </div>
    </section>;
};
export default Pricing;
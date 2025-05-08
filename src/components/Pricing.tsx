
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const Pricing = () => {
  return (
    <section id="pricing" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Pricing
          </h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Basic Plan */}
          <div className="feature-card border border-grattia-purple-light/20 rounded-2xl p-8 relative overflow-hidden animate-scale-in">
            <h3 className="text-2xl font-bold text-white mb-2">Basic Plan</h3>
            <div className="flex items-end mb-6">
              <span className="text-4xl font-bold text-white">$99</span>
              <span className="text-gray-300 ml-1">/mo</span>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-grattia-pink mr-2 mt-0.5" />
                <span className="text-gray-200">Up to 100 users</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-grattia-pink mr-2 mt-0.5" />
                <span className="text-gray-200">Basic rewards catalog</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-grattia-pink mr-2 mt-0.5" />
                <span className="text-gray-200">Priority support</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-grattia-pink mr-2 mt-0.5" />
                <span className="text-gray-200">Advanced analytics</span>
              </li>
            </ul>
            
            <Button className="grattia-button w-full">Get Started</Button>
          </div>
          
          {/* Enterprise Plan */}
          <div className="feature-card border border-grattia-purple-light/20 rounded-2xl p-8 relative overflow-hidden animate-scale-in" style={{ animationDelay: '100ms' }}>
            <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
            <div className="flex items-end mb-6">
              <span className="text-4xl font-bold text-white">Custom</span>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-grattia-pink mr-2 mt-0.5" />
                <span className="text-gray-200">Unlimited users</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-grattia-pink mr-2 mt-0.5" />
                <span className="text-gray-200">Custom rewards</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-grattia-pink mr-2 mt-0.5" />
                <span className="text-gray-200">24/7 support</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-grattia-pink mr-2 mt-0.5" />
                <span className="text-gray-200">Custom integration</span>
              </li>
            </ul>
            
            <Button className="grattia-button-outline w-full">Contact Sales</Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;

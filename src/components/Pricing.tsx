
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useState } from "react";

const Pricing = () => {
  const [employeeCount, setEmployeeCount] = useState(25);
  const monthlyPrice = employeeCount * 2.99;
  const annualPrice = monthlyPrice * 12 * 0.8; // 20% discount for annual

  return (
    <section id="pricing" className="py-20 px-4">
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
          {/* Pricing Calculator */}
          <div className="feature-card border border-grattia-purple-light/20 rounded-2xl p-8 mb-8 text-center animate-scale-in">
            <h3 className="text-2xl font-bold text-white mb-6">Calculate Your Cost</h3>
            
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Number of employees</label>
              <input
                type="range"
                min="10"
                max="500"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-400 mt-2">
                <span>10</span>
                <span className="text-2xl font-bold text-white">{employeeCount} employees</span>
                <span>500+</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="border border-grattia-purple-light/20 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-2">Monthly Billing</h4>
                <div className="text-3xl font-bold text-grattia-pink">${monthlyPrice.toFixed(2)}</div>
                <div className="text-gray-300">per month</div>
              </div>
              
              <div className="border border-grattia-purple-light/20 rounded-xl p-6 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-grattia-pink text-white text-xs px-3 py-1 rounded-full">
                  Save 20%
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Annual Billing</h4>
                <div className="text-3xl font-bold text-grattia-pink">${(annualPrice / 12).toFixed(2)}</div>
                <div className="text-gray-300">per month</div>
                <div className="text-sm text-gray-400 mt-1">${annualPrice.toFixed(2)} billed annually</div>
              </div>
            </div>

            <Button className="grattia-button text-lg py-6 px-10 mb-4">
              Start Free 14-Day Trial
            </Button>
            <p className="text-sm text-gray-400">No credit card required • Cancel anytime</p>
          </div>

          {/* Features Included */}
          <div className="feature-card border border-grattia-purple-light/20 rounded-2xl p-8 animate-scale-in" style={{ animationDelay: '100ms' }}>
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Everything Included</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-grattia-pink mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-200">Unlimited peer-to-peer recognition</span>
                </div>
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-grattia-pink mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-200">Real-time points and rewards system</span>
                </div>
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-grattia-pink mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-200">Comprehensive analytics dashboard</span>
                </div>
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-grattia-pink mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-200">500+ gift cards and experiences</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-grattia-pink mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-200">Custom company branding</span>
                </div>
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-grattia-pink mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-200">24/7 customer support</span>
                </div>
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-grattia-pink mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-200">Slack & Teams integration</span>
                </div>
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-grattia-pink mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-200">Advanced reporting & insights</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-grattia-purple-light/20 text-center">
              <p className="text-gray-300 mb-4">Questions about pricing?</p>
              <Button className="grattia-button-outline">Contact Sales</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;

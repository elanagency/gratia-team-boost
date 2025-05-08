
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle } from "lucide-react";

const Billing = () => {
  // Demo data
  const plans = [
    {
      name: "Free",
      price: "$0",
      interval: "forever",
      features: [
        "3 team members", 
        "10 recognitions per month", 
        "Basic rewards", 
        "Email support"
      ],
      isCurrent: true
    },
    {
      name: "Growth",
      price: "$49",
      interval: "per month",
      features: [
        "15 team members", 
        "Unlimited recognitions", 
        "Custom rewards", 
        "Priority support", 
        "Analytics"
      ],
      isCurrent: false
    },
    {
      name: "Enterprise",
      price: "$99",
      interval: "per month",
      features: [
        "Unlimited team members", 
        "Unlimited recognitions", 
        "Custom rewards", 
        "Priority support", 
        "Advanced analytics", 
        "API access", 
        "Custom integrations"
      ],
      isCurrent: false
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Billing & Plan</h1>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
        <AlertTriangle className="text-yellow-500 mt-1 mr-3" />
        <div>
          <h3 className="font-medium text-yellow-800">Free Trial</h3>
          <p className="text-yellow-700">You are currently on the free plan. Upgrade to unlock all features.</p>
        </div>
      </div>
      
      <h2 className="text-xl font-medium text-gray-800 mt-8 mb-4">Available Plans</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.name} className={`border-2 ${plan.isCurrent ? 'border-[#F572FF]' : 'border-gray-200'}`}>
            <CardHeader className={plan.isCurrent ? 'bg-[#F572FF]/10' : ''}>
              <CardTitle className="flex justify-between items-center">
                <span>{plan.name}</span>
                {plan.isCurrent && (
                  <span className="text-xs py-1 px-3 bg-[#F572FF] text-white rounded-full">
                    Current
                  </span>
                )}
              </CardTitle>
              <div className="mt-2">
                <span className="text-2xl font-bold">{plan.price}</span>
                <span className="text-gray-500 ml-1">{plan.interval}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className={`w-full ${
                  plan.isCurrent 
                    ? 'bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-not-allowed' 
                    : 'bg-[#F572FF] hover:bg-[#E061EE]'
                }`}
                disabled={plan.isCurrent}
              >
                {plan.isCurrent ? 'Current Plan' : 'Upgrade'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No billing history yet</p>
            <p className="text-sm mt-1">Your invoice history will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;

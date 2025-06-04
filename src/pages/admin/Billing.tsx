
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, CreditCard, Download } from "lucide-react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { SubscriptionStatusCard } from "@/components/settings/SubscriptionStatusCard";

const Billing = () => {
  // Demo data
  const plans = [
    {
      name: "Free Trial",
      price: "$0",
      interval: "forever",
      features: [
        "Up to 3 team members", 
        "10 recognitions per month", 
        "Basic rewards", 
        "Email support"
      ],
      isCurrent: false
    },
    {
      name: "Team Plan",
      price: "$2.99",
      interval: "per member/month",
      features: [
        "Unlimited team members", 
        "Unlimited recognitions", 
        "Custom rewards", 
        "Priority support", 
        "Analytics",
        "Prorated billing"
      ],
      isCurrent: true
    }
  ];

  // Sample invoices
  const invoices = [
    { id: "INV-001", date: "Nov 1, 2023", amount: "$29.90", status: "Paid" },
    { id: "INV-002", date: "Oct 1, 2023", amount: "$26.91", status: "Paid" },
    { id: "INV-003", date: "Sep 15, 2023", amount: "$14.95", status: "Paid" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Billing & Subscription</h1>
      
      {/* Subscription Status Card */}
      <SubscriptionStatusCard />
      
      <h2 className="text-xl font-medium text-gray-800 mt-8 mb-4">Available Plans</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <Card key={plan.name} className={`dashboard-card border-2 ${plan.isCurrent ? 'border-[#F572FF]' : 'border-gray-100'}`}>
            <div className={`p-4 ${plan.isCurrent ? 'bg-[#F572FF]/5' : ''}`}>
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                {plan.isCurrent && (
                  <span className="text-xs py-1 px-3 bg-[#F572FF] text-white rounded-full">
                    Current
                  </span>
                )}
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold">{plan.price}</span>
                <span className="text-gray-500 ml-1">{plan.interval}</span>
              </div>
            </div>
            
            <div className="p-4 pt-6 border-t border-gray-100">
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 shrink-0" />
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className={`w-full mt-6 ${
                  plan.isCurrent 
                    ? 'bg-gray-200 text-gray-500 hover:bg-gray-200 cursor-not-allowed' 
                    : 'bg-[#F572FF] hover:bg-[#E061EE]'
                }`}
                disabled={plan.isCurrent}
              >
                {plan.isCurrent ? 'Current Plan' : 'Switch Plan'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      
      <Card className="dashboard-card mt-8">
        <div className="card-header">
          <h2 className="card-title">Billing History</h2>
          <Button variant="outline" className="text-gray-600 border-gray-300 hover:bg-gray-50">
            <CreditCard className="mr-2 h-4 w-4" />
            Manage Payment Methods
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow className="border-gray-100">
              <TableHead className="text-gray-500">Invoice</TableHead>
              <TableHead className="text-gray-500">Date</TableHead>
              <TableHead className="text-gray-500">Amount</TableHead>
              <TableHead className="text-gray-500">Status</TableHead>
              <TableHead className="text-gray-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id} className="border-gray-100">
                <TableCell className="font-medium">{invoice.id}</TableCell>
                <TableCell className="text-gray-600">{invoice.date}</TableCell>
                <TableCell className="text-gray-600">{invoice.amount}</TableCell>
                <TableCell>
                  <span className="py-1 px-2 bg-green-100 text-green-700 rounded-full text-xs">
                    {invoice.status}
                  </span>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" className="text-gray-500">
                    <Download className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Billing;

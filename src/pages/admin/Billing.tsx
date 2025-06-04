
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Download } from "lucide-react";
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
  // Sample billing history including both subscription and points purchases
  const billingHistory = [
    { id: "INV-001", date: "Nov 1, 2023", amount: "$29.90", status: "Paid", type: "Subscription", description: "Monthly subscription - 10 members" },
    { id: "PTS-002", date: "Oct 25, 2023", amount: "$50.00", status: "Paid", type: "Points Purchase", description: "5,000 company points" },
    { id: "INV-003", date: "Oct 1, 2023", amount: "$26.91", status: "Paid", type: "Subscription", description: "Monthly subscription - 9 members" },
    { id: "PTS-004", date: "Sep 20, 2023", amount: "$25.00", status: "Paid", type: "Points Purchase", description: "2,500 company points" },
    { id: "INV-005", date: "Sep 15, 2023", amount: "$14.95", status: "Paid", type: "Subscription", description: "Prorated subscription - 5 members" },
  ];

  const getStatusBadge = (status: string) => {
    const baseClasses = "py-1 px-2 rounded-full text-xs";
    switch (status.toLowerCase()) {
      case 'paid':
        return `${baseClasses} bg-green-100 text-green-700`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-700`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-700`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  const getTypeBadge = (type: string) => {
    const baseClasses = "py-1 px-2 rounded-full text-xs";
    switch (type) {
      case 'Subscription':
        return `${baseClasses} bg-blue-100 text-blue-700`;
      case 'Points Purchase':
        return `${baseClasses} bg-purple-100 text-purple-700`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Billing & Subscription</h1>
      
      {/* Subscription Status Card */}
      <SubscriptionStatusCard />
      
      <Card className="dashboard-card">
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
              <TableHead className="text-gray-500">Type</TableHead>
              <TableHead className="text-gray-500">Description</TableHead>
              <TableHead className="text-gray-500">Amount</TableHead>
              <TableHead className="text-gray-500">Status</TableHead>
              <TableHead className="text-gray-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {billingHistory.map((item) => (
              <TableRow key={item.id} className="border-gray-100">
                <TableCell className="font-medium">{item.id}</TableCell>
                <TableCell className="text-gray-600">{item.date}</TableCell>
                <TableCell>
                  <span className={getTypeBadge(item.type)}>
                    {item.type}
                  </span>
                </TableCell>
                <TableCell className="text-gray-600">{item.description}</TableCell>
                <TableCell className="text-gray-600">{item.amount}</TableCell>
                <TableCell>
                  <span className={getStatusBadge(item.status)}>
                    {item.status}
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

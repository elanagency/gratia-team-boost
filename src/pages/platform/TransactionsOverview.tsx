
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Transaction {
  id: string;
  type: 'purchase' | 'distribution' | 'redemption';
  amount: number;
  description: string;
  company: string;
  date: string;
  status: string;
}

const TransactionsOverview = () => {
  const [transactionType, setTransactionType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['platform-transactions', transactionType],
    queryFn: async () => {
      // Get all companies first
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name');

      const companyMap = new Map(companies?.map(c => [c.id, c.name]) || []);

      // Get company point transactions
      const { data: companyTransactions } = await supabase
        .from('company_point_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      // Get point transactions between users
      const { data: pointTransactions } = await supabase
        .from('point_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      // Get reward redemptions with reward info
      const { data: redemptions } = await supabase
        .from('reward_redemptions')
        .select('*, reward_id')
        .order('redemption_date', { ascending: false });

      // Get reward info for redemptions
      const rewardIds = redemptions?.map(r => r.reward_id) || [];
      const { data: rewards } = await supabase
        .from('rewards')
        .select('id, name, company_id')
        .in('id', rewardIds);

      const allTransactions: Transaction[] = [];

      // Format company transactions
      companyTransactions?.forEach(transaction => {
        allTransactions.push({
          id: transaction.id,
          type: 'purchase',
          amount: transaction.amount,
          description: transaction.description,
          company: companyMap.get(transaction.company_id) || 'Unknown',
          date: transaction.created_at,
          status: transaction.payment_status || 'completed',
        });
      });

      // Format point transactions
      pointTransactions?.forEach(transaction => {
        allTransactions.push({
          id: transaction.id,
          type: 'distribution',
          amount: transaction.points,
          description: transaction.description,
          company: companyMap.get(transaction.company_id) || 'Unknown',
          date: transaction.created_at,
          status: 'completed',
        });
      });

      // Format redemptions
      redemptions?.forEach(redemption => {
        const reward = rewards?.find(r => r.id === redemption.reward_id);
        allTransactions.push({
          id: redemption.id,
          type: 'redemption',
          amount: redemption.points_spent,
          description: `Reward: ${reward?.name || 'Unknown'}`,
          company: reward ? (companyMap.get(reward.company_id) || 'Unknown') : 'Unknown',
          date: redemption.redemption_date,
          status: redemption.status,
        });
      });

      return allTransactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    },
  });

  const filteredTransactions = transactions?.filter(transaction => {
    const matchesType = transactionType === "all" || transaction.type === transactionType;
    const matchesSearch = transaction.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getTypeBadge = (type: string) => {
    const variants = {
      purchase: "bg-blue-100 text-blue-800",
      distribution: "bg-green-100 text-green-800",
      redemption: "bg-purple-100 text-purple-800",
    };
    
    return (
      <Badge variant="outline" className={variants[type as keyof typeof variants]}>
        {type}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
    };
    
    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants] || variants.pending}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions Overview</h1>
          <p className="text-gray-600">Monitor all platform transactions</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Transaction Type</label>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="purchase">Purchases</SelectItem>
                  <SelectItem value="distribution">Distributions</SelectItem>
                  <SelectItem value="redemption">Redemptions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Company or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions ({filteredTransactions?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="animate-pulse h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions?.map((transaction) => (
                  <TableRow key={`${transaction.type}-${transaction.id}`}>
                    <TableCell>
                      {getTypeBadge(transaction.type)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {transaction.company}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <span className="font-mono">
                        {transaction.amount.toLocaleString()} pts
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.status)}
                    </TableCell>
                    <TableCell>
                      {new Date(transaction.date).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsOverview;

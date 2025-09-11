import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Download, Calendar, CreditCard, Gift, Users } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['platform-transactions'],
    queryFn: async () => {
      // Only get point transactions (recognitions) - other tables removed
      const { data: pointTransactions } = await supabase
        .from('point_transactions')
        .select(`
          *
        `)
        .order('created_at', { ascending: false });

      // Other transaction types no longer exist
      const companyTransactions: any[] = [];
      const redemptions: any[] = [];

      // Get companies info for mapping
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name');

      // Create company name map
      const companyMap = new Map();
      companies?.forEach(company => {
        companyMap.set(company.id, company.name);
      });

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

      // Format redemptions - simplified without reward lookup
      redemptions?.forEach(redemption => {
        allTransactions.push({
          id: redemption.id,
          type: 'redemption',
          amount: redemption.points_spent,
          description: `Gift Card Redemption${redemption.goody_product_id ? ` (${redemption.goody_product_id})` : ''}`,
          company: 'Gift Card',
          date: redemption.redemption_date,
          status: redemption.status,
        });
      });

      // Sort by date descending
      return allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
  });

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate summary stats
  const totalValue = transactions.reduce((sum, t) => sum + t.amount, 0);
  const purchaseCount = transactions.filter(t => t.type === 'purchase').length;
  const distributionCount = transactions.filter(t => t.type === 'distribution').length;
  const redemptionCount = transactions.filter(t => t.type === 'redemption').length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <CreditCard className="h-4 w-4" />;
      case 'distribution':
        return <Users className="h-4 w-4" />;
      case 'redemption':
        return <Gift className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    
    return (
      <Badge variant="outline" className={variants[status] || variants.completed}>
        {status}
      </Badge>
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'text-blue-600';
      case 'distribution':
        return 'text-green-600';
      case 'redemption':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions Overview</h1>
        <p className="text-gray-600">Monitor all platform transactions and activities</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Purchases</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{purchaseCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Distributions</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{distributionCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Redemptions</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{redemptionCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-600">Total Value</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">${(totalValue / 100).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="purchase">Purchases</SelectItem>
                <SelectItem value="distribution">Distributions</SelectItem>
                <SelectItem value="redemption">Redemptions</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="animate-pulse h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Error loading transactions</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className={`flex items-center gap-2 ${getTypeColor(transaction.type)}`}>
                          {getTypeIcon(transaction.type)}
                          <span className="capitalize">{transaction.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.company}</TableCell>
                      <TableCell>
                        {transaction.type === 'purchase' ? 
                          `$${(transaction.amount / 100).toFixed(2)}` : 
                          `${transaction.amount} pts`
                        }
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-gray-500">No transactions found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsOverview;
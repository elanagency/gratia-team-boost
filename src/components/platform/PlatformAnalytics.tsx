
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface MonthlyData {
  month: string;
  companies: number;
  transactions: number;
  revenue: number;
}

export const PlatformAnalytics = () => {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['platform-analytics'],
    queryFn: async () => {
      // Get company growth over last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: companies } = await supabase
        .from('companies')
        .select('created_at')
        .gte('created_at', sixMonthsAgo.toISOString())
        .order('created_at');

      // Company point transactions no longer exist
      const transactions: any[] = [];

      // Group by month
      const monthlyData: Record<string, MonthlyData> = {};
      
      // Process companies
      companies?.forEach(company => {
        const month = new Date(company.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        if (!monthlyData[month]) {
          monthlyData[month] = { month, companies: 0, transactions: 0, revenue: 0 };
        }
        monthlyData[month].companies++;
      });

      // Process transactions
      transactions?.forEach(transaction => {
        const month = new Date(transaction.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        if (!monthlyData[month]) {
          monthlyData[month] = { month, companies: 0, transactions: 0, revenue: 0 };
        }
        monthlyData[month].transactions++;
        monthlyData[month].revenue += transaction.amount * 0.01; // Assuming $0.01 per point
      });

      return Object.values(monthlyData).sort((a: MonthlyData, b: MonthlyData) => 
        new Date(a.month + ' 1, 2024').getTime() - new Date(b.month + ' 1, 2024').getTime()
      );
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Company Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Company Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {isLoading ? (
              <div className="animate-pulse bg-gray-200 h-full rounded"></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="companies" 
                    stroke="#F572FF" 
                    strokeWidth={2}
                    name="New Companies"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {isLoading ? (
              <div className="animate-pulse bg-gray-200 h-full rounded"></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey="transactions" 
                    fill="#F572FF" 
                    name="Transactions"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

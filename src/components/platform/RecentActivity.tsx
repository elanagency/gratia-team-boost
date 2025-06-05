
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, CreditCard, Users } from "lucide-react";

interface Activity {
  type: string;
  title: string;
  subtitle?: string;
  time: string;
  icon: any;
  color: string;
}

export const RecentActivity = () => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      // Get recent companies
      const { data: companies } = await supabase
        .from('companies')
        .select('name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // Get recent transactions with company info
      const { data: transactions } = await supabase
        .from('company_point_transactions')
        .select('amount, created_at, transaction_type, company_id')
        .order('created_at', { ascending: false })
        .limit(5);

      // Get company names for transactions
      const companyIds = transactions?.map(t => t.company_id) || [];
      const { data: companyNames } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', companyIds);

      // Get recent team members
      const { data: members } = await supabase
        .from('company_members')
        .select('created_at, company_id, user_id')
        .order('created_at', { ascending: false })
        .limit(5);

      // Get company names for members
      const memberCompanyIds = members?.map(m => m.company_id) || [];
      const { data: memberCompanyNames } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', memberCompanyIds);

      // Get user profiles for members
      const userIds = members?.map(m => m.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      const activities: Activity[] = [];

      // Add company activities
      companies?.forEach(company => {
        activities.push({
          type: 'company',
          title: `New company registered: ${company.name}`,
          time: company.created_at,
          icon: Building2,
          color: 'bg-blue-50 text-blue-600',
        });
      });

      // Add transaction activities
      transactions?.forEach(transaction => {
        const company = companyNames?.find(c => c.id === transaction.company_id);
        activities.push({
          type: 'transaction',
          title: `${company?.name || 'Unknown Company'} - ${transaction.transaction_type}`,
          subtitle: `${transaction.amount} points`,
          time: transaction.created_at,
          icon: CreditCard,
          color: 'bg-green-50 text-green-600',
        });
      });

      // Add member activities
      members?.forEach(member => {
        const company = memberCompanyNames?.find(c => c.id === member.company_id);
        const profile = profiles?.find(p => p.id === member.user_id);
        const name = profile ? 
          `${profile.first_name} ${profile.last_name}` : 
          'New Member';
        activities.push({
          type: 'member',
          title: `${name} joined ${company?.name || 'Unknown Company'}`,
          time: member.created_at,
          icon: Users,
          color: 'bg-purple-50 text-purple-600',
        });
      });

      // Sort by time and return top 10
      return activities
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 10);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {activities?.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              activities?.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${activity.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      {activity.subtitle && (
                        <p className="text-sm text-gray-500">{activity.subtitle}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {new Date(activity.time).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

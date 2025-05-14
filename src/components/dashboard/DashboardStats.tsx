
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Users, Award, Gift, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

type StatItem = {
  title: string;
  value: string;
  icon: React.ElementType;
  description: string;
};

type DashboardStatsProps = {
  teamCount: number;
  isLoading: boolean;
  companyPoints: number;
};

export const DashboardStats = ({ teamCount, isLoading, companyPoints }: DashboardStatsProps) => {
  const [recognitionCount, setRecognitionCount] = useState<number>(0);
  const [rewardsCount, setRewardsCount] = useState<number>(0);
  const [isLoadingRecognitions, setIsLoadingRecognitions] = useState<boolean>(true);
  const { companyId } = useAuth();
  
  useEffect(() => {
    const fetchRecognitionStats = async () => {
      if (!companyId) return;
      
      try {
        setIsLoadingRecognitions(true);
        
        // Get current month boundaries
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Count recognitions for this month
        const { count: recognitionsThisMonth, error: recognitionsError } = await supabase
          .from('point_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .gte('created_at', startOfMonth.toISOString());
        
        if (recognitionsError) throw recognitionsError;
        
        // Count rewards claimed this month
        const { count: rewardsThisMonth, error: rewardsError } = await supabase
          .from('reward_redemptions')
          .select('*', { count: 'exact', head: true })
          .gte('redemption_date', startOfMonth.toISOString());
        
        if (rewardsError) throw rewardsError;
        
        setRecognitionCount(recognitionsThisMonth || 0);
        setRewardsCount(rewardsThisMonth || 0);
        
      } catch (error) {
        console.error("Error fetching recognition stats:", error);
      } finally {
        setIsLoadingRecognitions(false);
      }
    };
    
    fetchRecognitionStats();
  }, [companyId]);

  // Updated stats for the dashboard with company points as the first item
  const stats: StatItem[] = [
    { 
      title: "Company Balance", 
      value: isLoading ? "..." : `${companyPoints} points`, 
      icon: CreditCard, 
      description: "Available points" 
    },
    { 
      title: "Team Members", 
      value: isLoading ? "..." : teamCount.toString(), 
      icon: Users, 
      description: "Active members" 
    },
    { 
      title: "Recognitions", 
      value: isLoadingRecognitions ? "..." : recognitionCount.toString(), 
      icon: Award, 
      description: "This month" 
    },
    { 
      title: "Rewards Claimed", 
      value: isLoadingRecognitions ? "..." : rewardsCount.toString(), 
      icon: Gift, 
      description: "This month" 
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="dashboard-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">{stat.title}</p>
              <h3 className="text-2xl font-semibold mt-1">{stat.value}</h3>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center bg-[#F572FF]/10`}>
              <stat.icon className="h-6 w-6 text-[#F572FF]" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

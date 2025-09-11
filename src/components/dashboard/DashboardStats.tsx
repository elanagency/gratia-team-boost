
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Users, Award, Gift, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useUserPoints } from "@/hooks/useUserPoints";

type StatItem = {
  title: string;
  value: string;
  icon: React.ElementType;
  description: string;
};

type DashboardStatsProps = {
  teamCount: number;
  isLoading: boolean;
};

export const DashboardStats = ({ teamCount, isLoading }: DashboardStatsProps) => {
  const [recognitionCount, setRecognitionCount] = useState<number>(0);
  const [rewardsCount, setRewardsCount] = useState<number>(0);
  const [isLoadingRecognitions, setIsLoadingRecognitions] = useState<boolean>(true);
  const { companyId } = useAuth();
  const { recognitionPoints, monthlyPoints, isLoading: isLoadingUserPoints } = useUserPoints();
  
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
        
        // Rewards count is not tracked anymore
        const rewardsThisMonth = 0;
        
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

  // Updated stats for the dashboard focused on user experience
  const stats: StatItem[] = [
    { 
      title: "Recognition Points", 
      value: isLoadingUserPoints ? "..." : `${recognitionPoints} points`, 
      icon: Coins, 
      description: "Available to redeem" 
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="dashboard-card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-gray-500 text-xs sm:text-sm truncate">{stat.title}</p>
              <h3 className="text-lg sm:text-2xl font-semibold mt-1 truncate">{stat.value}</h3>
              <p className="text-xs text-gray-500 mt-1 truncate">{stat.description}</p>
            </div>
            <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center bg-[#F572FF]/10 flex-shrink-0 ml-2`}>
              <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-[#F572FF]" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

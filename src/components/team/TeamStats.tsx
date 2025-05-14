
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Award, Gift, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type StatItem = {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
};

type MemberData = {
  points: number;
  recognitionsReceived?: number;
  rewardsRedeemed?: number;
}

export const TeamStats = () => {
  const { user, userName, companyId } = useAuth();
  const [memberData, setMemberData] = useState<MemberData>({
    points: 0,
    recognitionsReceived: 0,
    rewardsRedeemed: 0
  });
  
  // Fetch the team member data when component mounts
  useEffect(() => {
    const fetchMemberData = async () => {
      if (!user || !companyId) return;
      
      try {
        // Get member points from company_members table
        const { data: memberData, error: memberError } = await supabase
          .from('company_members')
          .select('points')
          .eq('user_id', user.id)
          .eq('company_id', companyId)
          .maybeSingle();
        
        if (memberError) throw memberError;
        
        // Count recognitions received
        const { data: recognitionsData, error: recognitionsError } = await supabase
          .from('point_transactions')
          .select('id')
          .eq('recipient_id', user.id)
          .eq('company_id', companyId);
        
        if (recognitionsError) throw recognitionsError;
        
        // Count rewards redeemed
        const { data: rewardsData, error: rewardsError } = await supabase
          .from('reward_redemptions')
          .select('id')
          .eq('user_id', user.id);
        
        if (rewardsError) throw rewardsError;
        
        setMemberData({
          points: memberData?.points || 0,
          recognitionsReceived: recognitionsData?.length || 0,
          rewardsRedeemed: rewardsData?.length || 0
        });
      } catch (error) {
        console.error("Error fetching team member data:", error);
      }
    };
    
    fetchMemberData();
  }, [user, companyId]);

  // Sample stats for the team member dashboard
  const stats: StatItem[] = [
    { 
      title: "Your Points", 
      value: memberData.points, 
      icon: Star, 
      description: "Available to spend" 
    },
    { 
      title: "Recognitions", 
      value: memberData.recognitionsReceived || 0,
      icon: Award, 
      description: "Received this month" 
    },
    { 
      title: "Rewards", 
      value: memberData.rewardsRedeemed || 0,
      icon: Gift, 
      description: "Redeemed this year" 
    },
  ];

  return (
    <div className="space-y-6">
      <p className="text-gray-500">Check your stats and redeem your points for rewards!</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
    </div>
  );
};

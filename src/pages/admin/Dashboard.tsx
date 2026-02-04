import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { GivePointsCard } from "@/components/points/GivePointsCard";
import { RecognitionFeed } from "@/components/points/RecognitionFeed";
import { LeaderboardCard } from "@/components/points/LeaderboardCard";
import { RegionSetupDialog } from "@/components/onboarding/RegionSetupDialog";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { companyId, isAdmin } = useAuth();
  const [showRegionSetup, setShowRegionSetup] = useState(false);

  // Check if region setup is needed for admins
  const { data: company, refetch: refetchCompany } = useQuery({
    queryKey: ['company-region-setup', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('region_setup_complete')
        .eq('id', companyId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!companyId && isAdmin,
  });

  // Show region setup dialog for admins who haven't completed setup
  useEffect(() => {
    if (isAdmin && company && company.region_setup_complete === false) {
      setShowRegionSetup(true);
    }
  }, [isAdmin, company]);

  const handleRegionSetupComplete = () => {
    setShowRegionSetup(false);
    refetchCompany();
  };

  return (
    <div className="space-y-6">
      {/* Region Setup Dialog for new companies */}
      {companyId && (
        <RegionSetupDialog
          open={showRegionSetup}
          companyId={companyId}
          onComplete={handleRegionSetupComplete}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-fit">
        {/* Left Column - Give Points Card */}
        <div className="h-full">
          <GivePointsCard />
        </div>
        
        {/* Right Column - Recognition Feed */}
        <div className="h-full">
          <RecognitionFeed />
        </div>
      </div>
      
      {/* Bottom Section - Full Width Leaderboard */}
      <div>
        <LeaderboardCard />
      </div>
    </div>
  );
};

export default Dashboard;

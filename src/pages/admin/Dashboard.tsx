import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GivePointsCard } from "@/components/points/GivePointsCard";
import { RecognitionFeed } from "@/components/points/RecognitionFeed";
import { LeaderboardCard } from "@/components/points/LeaderboardCard";
import { RegionSetupDialog } from "@/components/onboarding/RegionSetupDialog";
import OnboardingChecklist from "@/components/onboarding/OnboardingChecklist";
import BillingSetupDialog from "@/components/team/BillingSetupDialog";
import { PersonalStatsCard } from "@/components/dashboard/PersonalStatsCard";
import { UpcomingCelebrations } from "@/components/dashboard/UpcomingCelebrations";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { companyId, isAdmin } = useAuth();
  const [showRegionSetup, setShowRegionSetup] = useState(false);
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const queryClient = useQueryClient();

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

  const handleBillingSetupComplete = () => {
    setBillingDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["onboarding-progress"] });
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

      {/* Billing Setup Dialog triggered from onboarding */}
      {companyId && (
        <BillingSetupDialog
          open={billingDialogOpen}
          onOpenChange={setBillingDialogOpen}
          onSetupComplete={handleBillingSetupComplete}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
      </div>

      {/* Onboarding Checklist for admins */}
      {isAdmin && (
        <OnboardingChecklist onUpgradeClick={() => setBillingDialogOpen(true)} />
      )}

      {/* Give Points composer */}
      <GivePointsCard />

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column - Recognition Feed */}
        <div className="lg:col-span-2">
          <RecognitionFeed />
        </div>

        {/* Right Column - Widgets */}
        <div className="flex flex-col gap-6">
          <PersonalStatsCard />
          <LeaderboardCard />
          <UpcomingCelebrations />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

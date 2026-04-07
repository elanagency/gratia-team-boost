import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GivePointsCard } from "@/components/points/GivePointsCard";
import { RecognitionFeed } from "@/components/points/RecognitionFeed";
import { RegionSetupDialog } from "@/components/onboarding/RegionSetupDialog";
import OnboardingChecklist from "@/components/onboarding/OnboardingChecklist";
import BillingSetupDialog from "@/components/team/BillingSetupDialog";
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

      {/* Onboarding Checklist for admins */}
      {isAdmin && (
        <OnboardingChecklist onUpgradeClick={() => setBillingDialogOpen(true)} />
      )}

      {/* Main Content - Single Column */}
      <div className="flex flex-col gap-5">
        <GivePointsCard />
        <RecognitionFeed />
      </div>
    </div>
  );
};

export default Dashboard;

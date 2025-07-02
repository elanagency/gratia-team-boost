
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CompanyPointsCard } from "@/components/settings/CompanyPointsCard";
import { CompanyInformationCard } from "@/components/settings/CompanyInformationCard";
import { TeamManagementCard } from "@/components/settings/TeamManagementCard";
import { MonthlyLimitsCard } from "@/components/settings/MonthlyLimitsCard";

const Settings = () => {
  const { companyId } = useAuth();
  const [companyPoints, setCompanyPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompanyData = async () => {
    if (!companyId) return;
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('points_balance')
        .eq('id', companyId)
        .single();
      
      if (error) throw error;
      
      setCompanyPoints(data?.points_balance || 0);
    } catch (error) {
      console.error("Error fetching company data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, [companyId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
      
      <div className="space-y-6">
        <CompanyPointsCard 
          companyPoints={companyPoints} 
          onPointsUpdated={fetchCompanyData}
        />
        <MonthlyLimitsCard />
        <TeamManagementCard />
        <CompanyInformationCard />
      </div>
    </div>
  );
};

export default Settings;


import React from "react";
import { CompanyInformationCard } from "@/components/settings/CompanyInformationCard";
import { TeamManagementCard } from "@/components/settings/TeamManagementCard";
import { MonthlyLimitsCard } from "@/components/settings/MonthlyLimitsCard";
import { BillingCard } from "@/components/settings/BillingCard";

const Settings = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
      
      <div className="space-y-6">
        <CompanyInformationCard />
        <TeamManagementCard />
        <MonthlyLimitsCard />
        <BillingCard />
      </div>
    </div>
  );
};

export default Settings;

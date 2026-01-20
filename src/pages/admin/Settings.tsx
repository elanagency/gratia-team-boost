import React from "react";
import { CompanyInformationCard } from "@/components/settings/CompanyInformationCard";
import { TeamManagementCard } from "@/components/settings/TeamManagementCard";
import { BillingCard } from "@/components/settings/BillingCard";
import SlackNotificationsCard from "@/components/settings/SlackNotificationsCard";
import TeamsNotificationsCard from "@/components/settings/TeamsNotificationsCard";
import DepartmentManagement from "@/components/team/DepartmentManagement";

const Settings = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
      
      <div className="space-y-6">
        <CompanyInformationCard />
        <DepartmentManagement />
        <TeamManagementCard />
        <BillingCard />
        <SlackNotificationsCard />
        <TeamsNotificationsCard />
      </div>
    </div>
  );
};

export default Settings;

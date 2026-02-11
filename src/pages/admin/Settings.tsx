import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CompanyInformationCard } from "@/components/settings/CompanyInformationCard";
import { TeamManagementCard } from "@/components/settings/TeamManagementCard";
import { BillingCard } from "@/components/settings/BillingCard";
import SlackNotificationsCard from "@/components/settings/SlackNotificationsCard";
import TeamsNotificationsCard from "@/components/settings/TeamsNotificationsCard";
import DepartmentManagement from "@/components/team/DepartmentManagement";
import CelebrationSettingsCard from "@/components/settings/CelebrationSettingsCard";

const Settings = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="celebrations">Celebrations</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <CompanyInformationCard />
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentManagement />
        </TabsContent>

        <TabsContent value="team">
          <TeamManagementCard />
        </TabsContent>

        <TabsContent value="celebrations">
          <CelebrationSettingsCard />
        </TabsContent>

        <TabsContent value="billing">
          <BillingCard />
        </TabsContent>

        <TabsContent value="notifications">
          <div className="space-y-6">
            <SlackNotificationsCard />
            <TeamsNotificationsCard />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;

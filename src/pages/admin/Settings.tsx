import React from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CompanyInformationCard } from "@/components/settings/CompanyInformationCard";
import { TeamManagementCard } from "@/components/settings/TeamManagementCard";
import { BillingCard } from "@/components/settings/BillingCard";
import SlackNotificationsCard from "@/components/settings/SlackNotificationsCard";
import TeamsNotificationsCard from "@/components/settings/TeamsNotificationsCard";
import CelebrationSettingsCard from "@/components/settings/CelebrationSettingsCard";
import { usePaymentVerification } from "@/hooks/usePaymentVerification";

const Settings = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "company";
  
  // Run payment verification at the page level so it fires regardless of active tab
  usePaymentVerification();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>

      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="celebrations">Celebrations</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <CompanyInformationCard />
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

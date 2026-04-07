import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Building, Users, Sparkles, CreditCard, Settings2 } from "lucide-react";
import { CompanyInformationCard } from "@/components/settings/CompanyInformationCard";
import { TeamManagementCard } from "@/components/settings/TeamManagementCard";
import { BillingCard } from "@/components/settings/BillingCard";
import SlackNotificationsCard from "@/components/settings/SlackNotificationsCard";
import TeamsNotificationsCard from "@/components/settings/TeamsNotificationsCard";
import CelebrationSettingsCard from "@/components/settings/CelebrationSettingsCard";
import { usePaymentVerification } from "@/hooks/usePaymentVerification";

const tabs = [
  { key: "company", label: "Company", icon: Building },
  { key: "team", label: "Team", icon: Users },
  { key: "celebrations", label: "Celebrations", icon: Sparkles },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "integrations", label: "Integrations", icon: Settings2 },
] as const;

type TabKey = (typeof tabs)[number]["key"];

const Settings = () => {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") || "company") as TabKey;
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  usePaymentVerification();

  const renderContent = () => {
    switch (activeTab) {
      case "company":
        return <CompanyInformationCard />;
      case "team":
        return <TeamManagementCard />;
      case "celebrations":
        return <CelebrationSettingsCard />;
      case "billing":
        return <BillingCard />;
      case "integrations":
        return (
          <div className="space-y-6">
            <SlackNotificationsCard />
            <TeamsNotificationsCard />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <h1
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 22,
          fontWeight: 600,
          color: "#0F0533",
          marginBottom: 18.75,
        }}
      >
        Settings
      </h1>

      <div className="flex" style={{ minHeight: "calc(100vh - 120px)" }}>
        {/* Sidebar */}
        <div
          className="flex flex-col gap-[4px] pr-[18.75px]"
          style={{ minWidth: 220, position: "sticky", top: 72, alignSelf: "flex-start" }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center w-full text-left"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  height: 36,
                  paddingLeft: 11.25,
                  paddingRight: 11.25,
                  gap: 9.375,
                  borderRadius: 13.375,
                  background: isActive ? "#F5F5F7" : "transparent",
                  color: isActive ? "#0F0533" : "#9996AA",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: "#E8E6F0", flexShrink: 0, alignSelf: "stretch" }} />

        {/* Content */}
        <div className="flex-1 pl-[18.75px]" style={{ minWidth: 0 }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;

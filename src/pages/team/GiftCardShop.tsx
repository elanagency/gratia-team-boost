import React from "react";
import { useSearchParams } from "react-router-dom";
import { RewardShop as RewardShopComponent } from "@/components/team/RewardShop";
import { RedemptionHistory } from "@/components/team/RedemptionHistory";
import { CreditCard, Clock } from "lucide-react";

const RewardShop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "shop";

  const handleTabChange = (value: string) => {
    setSearchParams(value === "shop" ? {} : { tab: value });
  };

  const tabs = [
    { value: "shop", label: "Gift Cards", icon: CreditCard },
    { value: "redemptions", label: "My Redemptions", icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#0F0533', fontFamily: 'Inter, sans-serif' }}>
        Redeem Points
      </h1>

      {/* Custom underline tabs */}
      <div style={{ display: 'flex', gap: 22.5, borderBottom: '1px solid #E8E6F0', height: 34.25 }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                paddingBottom: 13.25,
                fontSize: 14,
                fontWeight: 500,
                fontFamily: 'Inter, sans-serif',
                color: isActive ? '#0F0533' : '#9996AA',
                borderBottom: isActive ? '2px solid #7F2BFE' : '2px solid transparent',
                background: 'none',
                border: 'none',
                borderBottomStyle: 'solid',
                borderBottomWidth: 2,
                borderBottomColor: isActive ? '#7F2BFE' : 'transparent',
                cursor: 'pointer',
                padding: 0,
                paddingRight: 0,
                marginBottom: -1,
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "shop" && <RewardShopComponent />}
      {activeTab === "redemptions" && <RedemptionHistory />}
    </div>
  );
};

export default RewardShop;

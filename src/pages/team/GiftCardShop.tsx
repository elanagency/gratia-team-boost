import React from "react";
import { useSearchParams } from "react-router-dom";
import { RewardShop as RewardShopComponent } from "@/components/team/RewardShop";
import { RedemptionHistory } from "@/components/team/RedemptionHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const RewardShop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "shop";

  const handleTabChange = (value: string) => {
    setSearchParams(value === "shop" ? {} : { tab: value });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="shop">Shop</TabsTrigger>
          <TabsTrigger value="redemptions">My Redemptions</TabsTrigger>
        </TabsList>
        <TabsContent value="shop">
          <RewardShopComponent />
        </TabsContent>
        <TabsContent value="redemptions">
          <RedemptionHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RewardShop;

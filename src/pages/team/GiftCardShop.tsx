import React from "react";
import { RewardShop as RewardShopComponent } from "@/components/team/RewardShop";
import { RedemptionHistory } from "@/components/team/RedemptionHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const RewardShop = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="shop">
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

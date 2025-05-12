
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRedemptions } from "@/hooks/useRedemptions";
import { format } from "date-fns";

export const RedemptionHistory = () => {
  const { redemptions, isLoading } = useRedemptions();
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Redemption History</h2>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F572FF]"></div>
        </div>
      ) : redemptions.length > 0 ? (
        <div className="space-y-4">
          {redemptions.map((redemption) => (
            <Card key={redemption.id} className="p-4">
              <div className="flex flex-col sm:flex-row justify-between">
                <div className="flex gap-4 mb-3 sm:mb-0">
                  {redemption.reward?.image_url ? (
                    <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                      <img 
                        src={redemption.reward.image_url} 
                        alt={redemption.reward.name || "Reward"} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-400 text-xs">No image</span>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium">{redemption.reward?.name || "Unknown Reward"}</h4>
                    <p className="text-sm text-gray-500">
                      Redeemed on {format(new Date(redemption.redemption_date), 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm font-medium text-[#F572FF]">
                      {redemption.points_spent} points
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Badge className={getStatusColor(redemption.status)}>
                    {redemption.status.charAt(0).toUpperCase() + redemption.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <h3 className="text-lg font-medium text-gray-800">No redemption history</h3>
          <p className="text-gray-500 mt-2">
            You haven't redeemed any rewards yet. Check out the rewards shop to get started!
          </p>
        </Card>
      )}
    </div>
  );
};

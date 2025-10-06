import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRedemptions } from "@/hooks/useRedemptions";
import { format } from "date-fns";
import { Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export const RedemptionHistory = () => {
  const { redemptions, isLoading } = useRedemptions();
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'created':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'created':
        return 'Processing...';
      case 'completed':
        return 'Ready';
      case 'failed':
        return 'Failed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
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
                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-400 text-xs">Gift</span>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Gift Card Redemption</h4>
                    <p className="text-sm text-gray-500">
                      Redeemed on {format(new Date(redemption.redemption_date), 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm font-medium text-[#F572FF]">
                      {redemption.points_spent} points
                    </p>
                    {redemption.reward?.name && (
                      <p className="text-xs text-gray-400">
                        Reward: {redemption.reward.name}
                      </p>
                    )}
                    
                    {/* Show processing indicator for pending redemptions */}
                    {(redemption.status === 'pending' || redemption.status === 'created') && !redemption.external_order_id && (
                      <div className="flex items-center gap-1 text-xs text-yellow-600 mt-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Processing your gift card...</span>
                      </div>
                    )}
                    
                    {/* Show gift link button when available */}
                    {redemption.external_order_id && redemption.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => window.open(redemption.external_order_id!, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Gift Card
                      </Button>
                    )}
                    
                    {/* Show error message for failed redemptions */}
                    {redemption.status === 'failed' && (
                      <p className="text-xs text-red-600 mt-1">
                        Redemption failed - Points have been refunded
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Badge className={getStatusColor(redemption.status)}>
                    {getStatusLabel(redemption.status)}
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
            You haven't redeemed any gift cards yet. Check out the gift card shop to get started!
          </p>
        </Card>
      )}
    </div>
  );
};
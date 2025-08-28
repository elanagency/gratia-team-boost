import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { SubscriptionStatusCard } from "./SubscriptionStatusCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const BillingCard = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleManageBilling = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        throw error;
      }
      
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open billing portal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Team Slots & Billing Section */}
      <SubscriptionStatusCard />
      
      {/* Billing Management Section */}
      <Card className="dashboard-card">
        <div className="card-header">
          <h2 className="card-title">Billing Management</h2>
        </div>
        
        <div className="p-6">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Manage Your Subscription</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Access your complete billing portal to view invoices, update payment methods, 
                change your subscription plan, or cancel your subscription.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6 text-sm text-muted-foreground">
              <div className="flex flex-col items-center space-y-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  📄
                </div>
                <span>View & Download Invoices</span>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  💳
                </div>
                <span>Update Payment Methods</span>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  ⚙️
                </div>
                <span>Manage Subscription</span>
              </div>
            </div>
            
            <Button 
              onClick={handleManageBilling}
              disabled={isLoading}
              size="lg"
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {isLoading ? 'Opening Portal...' : 'Manage Billing & Subscriptions'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
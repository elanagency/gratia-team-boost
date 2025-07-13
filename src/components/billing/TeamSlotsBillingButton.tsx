
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Loader2, Users, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface TeamSlotsBillingButtonProps {
  currentSlots: number;
  suggestedSlots?: number;
  onSuccess?: () => void;
}

export const TeamSlotsBillingButton = ({ 
  currentSlots, 
  suggestedSlots = 5,
  onSuccess 
}: TeamSlotsBillingButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [teamSlots, setTeamSlots] = useState(currentSlots > 0 ? currentSlots : suggestedSlots);
  const [currentTeamMemberCount, setCurrentTeamMemberCount] = useState(0);
  const [isLoadingTeamCount, setIsLoadingTeamCount] = useState(false);
  const { companyId } = useAuth();

  // Fetch current team member count when dialog opens
  useEffect(() => {
    if (dialogOpen && companyId) {
      fetchTeamMemberCount();
    }
  }, [dialogOpen, companyId]);

  const fetchTeamMemberCount = async () => {
    setIsLoadingTeamCount(true);
    try {
      const { count, error } = await supabase
        .from('company_members')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('is_admin', false);

      if (error) throw error;
      setCurrentTeamMemberCount(count || 0);
    } catch (error) {
      console.error("Error fetching team member count:", error);
    } finally {
      setIsLoadingTeamCount(false);
    }
  };

  const handleCreateCheckout = async () => {
    if (!companyId) {
      toast.error("Company ID not found");
      return;
    }

    if (teamSlots < 1) {
      toast.error("Please enter at least 1 team slot");
      return;
    }

    // Check if trying to downgrade below current team member count
    if (teamSlots < currentTeamMemberCount) {
      toast.error(`Cannot downgrade to ${teamSlots} slots. You currently have ${currentTeamMemberCount} team members. Please remove team members first or choose a higher number of slots.`);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("Creating team slots checkout for:", { companyId, teamSlots });
      
      const origin = window.location.origin;
      
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: { 
          companyId,
          teamSlots,
          origin
        }
      });
      
      if (error) throw error;
      
      console.log("Checkout response:", data);
      
      // Close dialog
      setDialogOpen(false);
      
      // Handle different response types
      if (data.success && data.redirect_url) {
        // Subscription was updated directly
        toast.success("Team slots updated successfully!");
        window.location.href = data.redirect_url;
      } else if (data.url) {
        // New subscription - redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL or success response received");
      }
    } catch (error) {
      console.error("Error creating team slots checkout:", error);
      toast.error("Failed to setup team slots billing. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMonthlyTotal = (slots: number) => {
    return (slots * 2.99).toFixed(2);
  };

  const isUpgrade = teamSlots > currentSlots;
  const isDowngrade = teamSlots < currentSlots && currentSlots > 0;
  const isNewSubscription = currentSlots === 0;
  const isInvalidDowngrade = teamSlots < currentTeamMemberCount;

  const getButtonText = () => {
    if (isNewSubscription) return "Purchase Team Slots";
    if (isUpgrade) return `Upgrade to ${teamSlots} Slots`;
    if (isDowngrade) return `Downgrade to ${teamSlots} Slots`;
    return "Update Team Slots";
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-[#F572FF] hover:bg-[#E061EE] text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              {currentSlots > 0 ? "Manage Team Slots" : "Purchase Team Slots"}
            </>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#F572FF]" />
            Team Slots Configuration
          </DialogTitle>
          <DialogDescription>
            Choose how many team slots you need for your organization. 
            Each slot allows you to add one team member.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {currentSlots > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                Current subscription: <span className="font-semibold">{currentSlots} slots</span>
              </p>
              {isLoadingTeamCount ? (
                <p className="text-sm text-gray-500 mt-1">Loading team member count...</p>
              ) : (
                <p className="text-sm text-gray-500 mt-1">
                  Current team members: <span className="font-medium">{currentTeamMemberCount}</span>
                </p>
              )}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="team-slots">Number of Team Slots</Label>
            <Input
              id="team-slots"
              type="number"
              min="1"
              max="500"
              value={teamSlots}
              onChange={(e) => setTeamSlots(parseInt(e.target.value) || 1)}
              placeholder="Enter number of slots"
              className={isInvalidDowngrade ? "border-red-500" : ""}
            />
            <p className="text-xs text-gray-500">
              Minimum: 1 slot • Maximum: 500 slots
            </p>
          </div>

          {isInvalidDowngrade && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Cannot downgrade below current team size</p>
                <p className="text-sm text-red-700 mt-1">
                  You currently have {currentTeamMemberCount} team members. You need at least {currentTeamMemberCount} slots to accommodate your current team.
                </p>
                <p className="text-sm text-red-700 mt-2">
                  Please remove some team members first or choose a higher number of slots.
                </p>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-blue-800">Pricing Summary</span>
            </div>
            <div className="space-y-1 text-sm text-blue-700">
              <div className="flex justify-between">
                <span>{teamSlots} team slot{teamSlots > 1 ? 's' : ''} × $2.99</span>
                <span>${calculateMonthlyTotal(teamSlots)}/month</span>
              </div>
              {!isNewSubscription && (
                <div className="text-xs pt-2 border-t border-blue-200">
                  Changes will be prorated and reflected in your next bill
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Quick suggestions:</h4>
            <div className="flex gap-2 flex-wrap">
              {[5, 10, 15, 25].map((slots) => (
                <Button
                  key={slots}
                  variant="outline"
                  size="sm"
                  onClick={() => setTeamSlots(slots)}
                  className={teamSlots === slots ? "bg-[#F572FF] text-white" : ""}
                  disabled={slots < currentTeamMemberCount}
                >
                  {slots} slots
                  {slots < currentTeamMemberCount && (
                    <span className="ml-1 text-xs opacity-60">*</span>
                  )}
                </Button>
              ))}
            </div>
            {currentTeamMemberCount > 0 && (
              <p className="text-xs text-gray-500">
                * Options below {currentTeamMemberCount} slots are disabled due to current team size
              </p>
            )}
          </div>
          
          <Button 
            onClick={handleCreateCheckout}
            disabled={isLoading || teamSlots < 1 || isInvalidDowngrade}
            className="w-full bg-[#F572FF] hover:bg-[#E061EE] text-white"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating checkout...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {getButtonText()} - ${calculateMonthlyTotal(teamSlots)}/month
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

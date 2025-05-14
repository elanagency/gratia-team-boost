
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface CompanyPointsCardProps {
  companyPoints: number;
  onPointsUpdated: () => void;
}

export const CompanyPointsCard = ({ companyPoints, onPointsUpdated }: CompanyPointsCardProps) => {
  const [openTopUp, setOpenTopUp] = useState(false);
  const [pointsToAdd, setPointsToAdd] = useState<number>(100);
  const [isLoading, setIsLoading] = useState(false);
  const { user, companyId } = useAuth();

  const handleTopUp = async () => {
    if (!pointsToAdd || pointsToAdd <= 0 || !companyId || !user?.id) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    
    try {
      // Create a transaction record
      const { error: transactionError } = await supabase
        .from('company_point_transactions')
        .insert({
          company_id: companyId,
          amount: pointsToAdd,
          description: `Points top-up: ${pointsToAdd} points`,
          created_by: user.id,
          transaction_type: 'top_up'
        });

      if (transactionError) throw transactionError;

      // Update company balance
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          points_balance: companyPoints + pointsToAdd
        })
        .eq('id', companyId);

      if (updateError) throw updateError;

      toast.success(`Successfully added ${pointsToAdd} points to your company balance`);
      setOpenTopUp(false);
      onPointsUpdated();
    } catch (error) {
      console.error("Error adding points:", error);
      toast.error("Failed to add points");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="dashboard-card">
        <div className="card-header">
          <h2 className="card-title">Company Points Balance</h2>
        </div>
        
        <div className="mt-6 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 rounded-md">
          <div>
            <p className="text-gray-500 text-sm font-medium">Current Balance</p>
            <p className="text-2xl font-bold text-[#F572FF]">{companyPoints} points</p>
            <p className="text-sm text-gray-500 mt-1">
              Points are used to recognize team members' contributions
            </p>
          </div>
          
          <Button 
            onClick={() => setOpenTopUp(true)}
            className="bg-[#F572FF] hover:bg-[#E061EE]"
          >
            <Plus className="mr-2 h-4 w-4" /> Top Up Points
          </Button>
        </div>
      </Card>

      {/* Top Up Dialog */}
      <Dialog open={openTopUp} onOpenChange={setOpenTopUp}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Company Points</DialogTitle>
            <DialogDescription>
              Add more points to your company balance to recognize team members' contributions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="points">Points to Add</Label>
              <Input
                id="points"
                type="number" 
                min={1}
                value={pointsToAdd}
                onChange={(e) => setPointsToAdd(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Cost:</span>
                <span className="font-semibold">${(pointsToAdd * 0.01).toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500">
                Points cost $0.01 per point. This is for demonstration purposes only.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenTopUp(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleTopUp} 
              disabled={isLoading || pointsToAdd <= 0}
              className="bg-[#F572FF] hover:bg-[#E061EE]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Add Points
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

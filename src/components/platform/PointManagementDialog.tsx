import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PointManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  company: {
    id: string;
    name: string;
    points_balance: number;
  };
  operation: 'grant' | 'remove';
  onSuccess: () => void;
}

export const PointManagementDialog = ({ 
  isOpen, 
  onClose, 
  company, 
  operation,
  onSuccess 
}: PointManagementDialogProps) => {
  const [amount, setAmount] = useState<number>(100);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isGrant = operation === 'grant';
  const title = isGrant ? 'Grant Points' : 'Remove Points';
  const actionLabel = isGrant ? 'Grant' : 'Remove';
  const icon = isGrant ? Plus : Minus;
  const IconComponent = icon;

  const newBalance = isGrant 
    ? company.points_balance + amount 
    : company.points_balance - amount;

  const canRemove = operation === 'remove' ? company.points_balance >= amount : true;

  const handleSubmit = async () => {
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!description.trim()) {
      toast.error("Please provide a description");
      return;
    }

    if (operation === 'remove' && !canRemove) {
      toast.error("Cannot remove more points than available");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('platform-manage-company-points', {
        body: {
          company_id: company.id,
          amount,
          operation,
          description: description.trim()
        }
      });

      if (error) throw error;

      toast.success(
        `Successfully ${operation === 'grant' ? 'granted' : 'removed'} ${amount} points ${operation === 'grant' ? 'to' : 'from'} ${company.name}`
      );
      
      onSuccess();
      onClose();
      
      // Reset form
      setAmount(100);
      setDescription("");
    } catch (error) {
      console.error(`Error ${operation}ing points:`, error);
      toast.error(`Failed to ${operation} points`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setAmount(100);
    setDescription("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {isGrant 
              ? `Grant points to ${company.name} without payment processing.`
              : `Remove points from ${company.name}'s balance.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Points to {actionLabel}</Label>
            <Input
              id="amount"
              type="number" 
              min={1}
              max={operation === 'remove' ? company.points_balance : undefined}
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description/Reason *</Label>
            <Textarea
              id="description"
              placeholder={`Reason for ${operation === 'grant' ? 'granting' : 'removing'} points...`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="bg-muted/50 p-4 rounded-md space-y-2">
            <h4 className="font-medium text-sm">Balance Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Current Balance</span>
                <span className="font-medium">{company.points_balance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Points to {actionLabel}</span>
                <span className={isGrant ? "text-green-600" : "text-red-600"}>
                  {isGrant ? '+' : '-'}{amount.toLocaleString()}
                </span>
              </div>
              <div className="border-t pt-1 flex justify-between font-medium">
                <span>New Balance</span>
                <span className={newBalance < 0 ? "text-red-600" : ""}>{newBalance.toLocaleString()}</span>
              </div>
            </div>
            
            {operation === 'remove' && !canRemove && (
              <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Insufficient points to remove this amount</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || amount <= 0 || !description.trim() || !canRemove}
            className={isGrant ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <IconComponent className="mr-2 h-4 w-4" />
                {actionLabel} {amount} Points
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
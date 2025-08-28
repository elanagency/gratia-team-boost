import React, { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { User, Coins, Plus, Minus } from "lucide-react";

interface Member {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  points: number;
  is_admin: boolean;
  role: string;
  department?: string;
}

interface MemberPointManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  companyId: string;
  onSuccess: () => void;
}

const MemberPointManagementDialog: React.FC<MemberPointManagementDialogProps> = ({
  isOpen,
  onClose,
  member,
  companyId,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [operation, setOperation] = useState<string>("grant");
  const [isLoading, setIsLoading] = useState(false);

  if (!member) return null;

  const currentBalance = member.points || 0;
  const numericAmount = parseInt(amount) || 0;
  const newBalance = operation === "grant" 
    ? currentBalance + numericAmount 
    : currentBalance - numericAmount;
  const canRemove = operation === "remove" ? currentBalance >= numericAmount : true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (numericAmount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    if (!canRemove) {
      toast.error("Insufficient points for removal");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        'platform-manage-member-points',
        {
          body: {
            member_id: member.user_id,
            company_id: companyId,
            amount: numericAmount,
            operation,
            description: description.trim(),
          },
        }
      );

      if (error) throw error;

      toast.success(
        `Successfully ${operation === "grant" ? "granted" : "removed"} ${numericAmount} points ${operation === "grant" ? "to" : "from"} ${member.first_name} ${member.last_name}`
      );
      
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error managing member points:', error);
      toast.error(error.message || "Failed to manage member points");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    setDescription("");
    setOperation("grant");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Manage Member Points
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Member Info */}
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{member.first_name} {member.last_name}</p>
              <p className="text-sm text-muted-foreground">{member.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  member.is_admin 
                    ? "bg-primary/10 text-primary" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {member.is_admin ? "Admin" : "Member"}
                </span>
                {member.department && (
                  <span className="text-xs text-muted-foreground">
                    {member.department}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current Points</p>
              <p className="text-lg font-semibold">{currentBalance.toLocaleString()}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Operation Toggle */}
            <div className="space-y-2">
              <Label>Operation</Label>
              <ToggleGroup
                type="single"
                value={operation}
                onValueChange={(value) => value && setOperation(value)}
                className="grid grid-cols-2 w-full"
              >
                <ToggleGroupItem 
                  value="grant" 
                  className="flex items-center gap-2"
                  data-state={operation === "grant" ? "on" : "off"}
                >
                  <Plus className="h-4 w-4" />
                  Add Points
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="remove" 
                  className="flex items-center gap-2"
                  data-state={operation === "remove" ? "on" : "off"}
                >
                  <Minus className="h-4 w-4" />
                  Remove Points
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter points amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the reason for this point adjustment..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
              />
            </div>

            {/* Balance Summary */}
            {numericAmount > 0 && (
              <>
                <Separator />
                <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Current Balance:</span>
                    <span>{currentBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>
                      {operation === "grant" ? "Adding:" : "Removing:"}
                    </span>
                    <span className={operation === "grant" ? "text-green-600" : "text-red-600"}>
                      {operation === "grant" ? "+" : "-"}{numericAmount.toLocaleString()}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>New Balance:</span>
                    <span className={newBalance >= 0 ? "text-green-600" : "text-red-600"}>
                      {newBalance.toLocaleString()}
                    </span>
                  </div>
                  {!canRemove && (
                    <p className="text-sm text-red-600 mt-2">
                      Insufficient points for removal
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className={`flex-1 ${
                  operation === "remove" 
                    ? "bg-red-600 hover:bg-red-700" 
                    : "bg-green-600 hover:bg-green-700"
                }`}
                disabled={isLoading || !amount || !description.trim() || !canRemove}
              >
                {isLoading ? "Processing..." : 
                  operation === "grant" ? "Grant Points" : "Remove Points"
                }
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberPointManagementDialog;
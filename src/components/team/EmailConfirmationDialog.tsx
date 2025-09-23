import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface EmailConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recipientEmail: string;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  isProcessing: boolean;
}

export const EmailConfirmationDialog = ({
  isOpen,
  onOpenChange,
  recipientEmail,
  onEmailChange,
  onSubmit,
  isProcessing
}: EmailConfirmationDialogProps) => {
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Confirm Gift Email</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              name="email" 
              type="email"
              value={recipientEmail} 
              onChange={onEmailChange}
              placeholder="Enter recipient email"
            />
            <p className="text-sm text-muted-foreground">
              The gift link will be sent to this email address
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={onSubmit}
            className="bg-[#F572FF] hover:bg-[#F572FF]/90"
            disabled={isProcessing || !isValidEmail}
          >
            {isProcessing ? "Processing..." : "Redeem Gift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
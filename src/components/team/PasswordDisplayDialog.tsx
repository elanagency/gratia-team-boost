
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle } from "lucide-react";
import { useState } from "react";

interface PasswordDisplayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passwordInfo: {
    isNewUser: boolean;
    password: string;
    email: string;
    name: string;
  };
  onClose: () => void;
}

const PasswordDisplayDialog = ({ 
  open, 
  onOpenChange, 
  passwordInfo, 
  onClose 
}: PasswordDisplayDialogProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // This component is deprecated but kept for backward compatibility
  // New invitations use email-based credential delivery
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Team Member Added Successfully!</DialogTitle>
          <DialogDescription>
            <strong>Note:</strong> This dialog is deprecated. New team members now receive their login credentials via email automatically.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>{passwordInfo.name}</strong> has been added to your team and should have received an email with login instructions.
          </p>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onClose} className="bg-[#F572FF] hover:bg-[#E061EE] text-white">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordDisplayDialog;

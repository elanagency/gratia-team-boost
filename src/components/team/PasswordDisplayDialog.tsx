
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface PasswordInfo {
  isNewUser: boolean;
  password: string;
  email: string;
  name: string;
}

interface PasswordDisplayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passwordInfo: PasswordInfo;
  onClose: () => void;
}

const PasswordDisplayDialog = ({
  open,
  onOpenChange,
  passwordInfo,
  onClose,
}: PasswordDisplayDialogProps) => {
  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(passwordInfo.password)
      .then(() => {
        toast({
          title: "Success",
          description: "Password copied to clipboard",
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to copy password",
          variant: "destructive",
        });
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Team Member Created</DialogTitle>
          <DialogDescription>
            A new account has been created for {passwordInfo.name}. Share these temporary credentials with them.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Email</Label>
            <div className="col-span-3 bg-gray-100 p-2 rounded text-sm">
              {passwordInfo.email}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Password</Label>
            <div className="col-span-3 bg-gray-100 p-2 rounded text-sm font-mono flex items-center justify-between">
              {passwordInfo.password}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyPasswordToClipboard} 
                className="ml-2"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="text-sm text-amber-600 mt-2">
            <strong>Important:</strong> This password will only be shown once. Make sure to copy it before closing this dialog.
          </div>
        </div>
        <Button 
          onClick={onClose} 
          className="w-full bg-[#F572FF] hover:bg-[#E061EE] text-white"
        >
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordDisplayDialog;

import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Company {
  id: string;
  name: string;
  team_member_count?: number;
  points_balance: number;
}

interface DeleteCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

const DeleteCompanyDialog: React.FC<DeleteCompanyDialogProps> = ({
  open,
  onOpenChange,
  company,
  onConfirm,
  isLoading = false,
}) => {
  const [confirmText, setConfirmText] = useState("");

  const isConfirmValid = confirmText === company?.name;

  const handleConfirm = () => {
    if (isConfirmValid) {
      onConfirm();
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmText("");
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            Delete Company
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold">{company?.name}</span>?
              </p>
              
              <div className="bg-destructive/10 p-3 rounded-md">
                <p className="text-sm font-medium text-destructive mb-2">
                  This action will permanently delete:
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• All {company?.team_member_count || 0} team members</li>
                  <li>• {company?.points_balance || 0} company points</li>
                  <li>• All point transactions and history</li>
                  <li>• All rewards and categories</li>
                  <li>• All subscription data</li>
                  <li>• All company data and settings</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-name" className="text-sm font-medium">
                  Type the company name to confirm:
                </Label>
                <Input
                  id="confirm-name"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={company?.name}
                  disabled={isLoading}
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmValid || isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? "Deleting..." : "Delete Company"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteCompanyDialog;
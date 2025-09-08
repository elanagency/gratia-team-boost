import React from "react";
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

interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  points: number;
  is_admin: boolean;
}

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  companyName: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({
  open,
  onOpenChange,
  user,
  companyName,
  onConfirm,
  isLoading = false,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            Remove User from Company
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Are you sure you want to remove{" "}
                <span className="font-semibold">
                  {user?.first_name} {user?.last_name}
                </span>{" "}
                from <span className="font-semibold">{companyName}</span>?
              </p>

              <div className="bg-muted p-3 rounded-md space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Email:</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Role:</span>
                  <span className="font-medium">
                    {user?.is_admin ? "Admin" : "Member"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Current Points:</span>
                  <span className="font-medium">{user?.points || 0}</span>
                </div>
              </div>

              {user && user.points > 0 && (
                <div className="bg-accent/20 p-3 rounded-md">
                  <p className="text-sm text-accent-foreground">
                    <strong>Note:</strong> {user.points} points will be returned to the company's balance.
                  </p>
                </div>
              )}

              <div className="bg-destructive/10 p-3 rounded-md">
                <p className="text-sm text-destructive">
                  <strong>Warning:</strong> This action will permanently remove the user from the company and delete all their associated data including transactions, redemptions, and activity history.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? "Removing..." : "Remove User"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteUserDialog;
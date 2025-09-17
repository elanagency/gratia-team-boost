import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type CompanyMember as TeamMember } from "@/hooks/useCompanyMembers";
import EditMemberForm from "./EditMemberForm";

interface EditTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  onSuccess: () => void;
}

const EditTeamMemberDialog: React.FC<EditTeamMemberDialogProps> = ({
  open,
  onOpenChange,
  member,
  onSuccess
}) => {
  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
        </DialogHeader>
        <EditMemberForm
          member={member}
          onSuccess={() => {
            onSuccess();
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditTeamMemberDialog;

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import NewDepartmentCombobox from "@/components/team/NewDepartmentCombobox";

interface InviteFormProps {
  email: string;
  setEmail: (email: string) => void;
  name: string;
  setName: (name: string) => void;
  department: string;
  setDepartment: (department: string) => void;
  isSubmitting: boolean;
  isFirstMember: boolean;
  onSubmit: (e: React.FormEvent) => void;
  emailError?: string;
}

const InviteForm = ({
  email,
  setEmail,
  name,
  setName,
  department,
  setDepartment,
  isSubmitting,
  isFirstMember,
  onSubmit,
  emailError,
}: InviteFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">
          Name *
        </Label>
        <Input 
          id="name" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter full name"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">
          Email *
        </Label>
        <Input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          required
          className={emailError ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {emailError && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{emailError}</span>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="department">Department *</Label>
        <NewDepartmentCombobox
          value={department}
          onChange={setDepartment}
          placeholder="Select or create department"
        />
      </div>
      <Button 
        type="submit" 
        disabled={isSubmitting || !!emailError} 
        className="w-full bg-[#F572FF] hover:bg-[#E061EE] text-white"
      >
        {isSubmitting ? "Adding..." : isFirstMember ? "Add Member & Setup Billing" : "Invite Team Member"}
      </Button>
    </form>
  );
};

export default InviteForm;

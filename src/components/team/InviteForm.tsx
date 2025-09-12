
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DepartmentCombobox from "@/components/team/DepartmentCombobox";

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
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <DepartmentCombobox
          value={department}
          onChange={setDepartment}
          placeholder="Select or create department (optional)"
        />
      </div>
      <Button 
        type="submit" 
        disabled={isSubmitting} 
        className="w-full bg-[#F572FF] hover:bg-[#E061EE] text-white"
      >
        {isSubmitting ? "Adding..." : isFirstMember ? "Add Member & Setup Billing" : "Invite Team Member"}
      </Button>
    </form>
  );
};

export default InviteForm;

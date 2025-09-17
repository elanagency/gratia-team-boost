import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { type CompanyMember as TeamMember, useTeamMembers } from "@/hooks/useCompanyMembers";

interface EditMemberFormProps {
  member: TeamMember;
  onSuccess: () => void;
  onCancel: () => void;
}

const EditMemberForm: React.FC<EditMemberFormProps> = ({
  member,
  onSuccess,
  onCancel
}) => {
  const [name, setName] = useState(member.name);
  const [department, setDepartment] = useState(member.department || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateMember } = useTeamMembers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await updateMember(member.id, {
        name: name.trim(),
        department: department.trim() || null
      });
      onSuccess();
    } catch (error) {
      console.error("Error updating member:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">
          Name *
        </Label>
        <Input 
          id="edit-name" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter full name"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="edit-email">
          Email
        </Label>
        <Input
          id="edit-email"
          value={member.email}
          disabled
          className="bg-gray-50 text-gray-500"
          placeholder="Email cannot be changed"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="edit-department">
          Department
        </Label>
        <Input
          id="edit-department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="Enter department (optional)"
        />
      </div>
      
      <div className="flex gap-2 pt-4">
        <Button 
          type="submit" 
          disabled={isSubmitting || !name.trim()} 
          className="flex-1 bg-[#F572FF] hover:bg-[#E061EE] text-white"
        >
          {isSubmitting ? "Updating..." : "Update Member"}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default EditMemberForm;
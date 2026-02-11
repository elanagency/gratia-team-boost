import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { type CompanyMember as TeamMember, useTeamMembers } from "@/hooks/useCompanyMembers";
import NewDepartmentCombobox from "@/components/team/NewDepartmentCombobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [departmentId, setDepartmentId] = useState<string | undefined>(member.department_id || undefined);
  const [role, setRole] = useState<'user' | 'admin'>(member.is_admin ? 'admin' : 'user');
  const [birthday, setBirthday] = useState(member.birthday || "");
  const [companyStartDate, setCompanyStartDate] = useState(member.company_start_date || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateMember } = useTeamMembers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await updateMember(member.id, {
        name: name.trim(),
        department: department.trim() || null,
        department_id: departmentId || null,
        is_admin: role === 'admin',
        birthday: birthday || null,
        company_start_date: companyStartDate || null
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
        <NewDepartmentCombobox
          value={department}
          onChange={(name, id) => {
            setDepartment(name);
            setDepartmentId(id);
          }}
          placeholder="Select or create department"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-role">Role</Label>
        <Select value={role} onValueChange={(value: 'user' | 'admin') => setRole(value)}>
          <SelectTrigger id="edit-role">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User - Standard team member</SelectItem>
            <SelectItem value="admin">Admin - Can access Analytics & Settings</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-birthday">Birthday</Label>
          <Input
            type="date"
            id="edit-birthday"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-companyStartDate">Company Start Date</Label>
          <Input
            type="date"
            id="edit-companyStartDate"
            value={companyStartDate}
            onChange={(e) => setCompanyStartDate(e.target.value)}
          />
        </div>
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
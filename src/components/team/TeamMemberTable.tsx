
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { TeamMember } from "@/hooks/useTeamMembers";

interface TeamMemberTableProps {
  teamMembers: TeamMember[];
  onRemoveMember: (member: TeamMember) => void;
}

const TeamMemberTable: React.FC<TeamMemberTableProps> = ({
  teamMembers,
  onRemoveMember
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-gray-100">
          <TableHead className="text-gray-500">Name</TableHead>
          <TableHead className="text-gray-500">Email</TableHead>
          <TableHead className="text-gray-500">Department</TableHead>
          <TableHead className="text-gray-500">Status</TableHead>
          <TableHead className="text-gray-500">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {teamMembers.length > 0 ? (
          teamMembers.map((member) => (
            <TableRow key={member.id} className="border-gray-100">
              <TableCell className="font-medium">
                {member.name}
              </TableCell>
              <TableCell className="text-gray-600">{member.email}</TableCell>
              <TableCell className="text-gray-600">{member.department || 'Not specified'}</TableCell>
              <TableCell>
                <Badge 
                  variant={member.invitation_status === 'active' ? 'default' : 'secondary'}
                  className={member.invitation_status === 'active' 
                    ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                    : 'bg-orange-100 text-orange-800 hover:bg-orange-100'
                  }
                >
                  {member.invitation_status === 'active' ? 'Active' : 'Invited'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-500 hover:text-red-500" 
                    onClick={() => onRemoveMember(member)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
              No team members found. Invite your first team member!
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default TeamMemberTable;

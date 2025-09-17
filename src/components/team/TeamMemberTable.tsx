
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoreHorizontal, Edit, Trash2, Mail } from "lucide-react";
import { TeamMember } from "@/hooks/useTeamMembers";

interface TeamMemberTableProps {
  teamMembers: TeamMember[];
  onRemoveMember: (member: TeamMember) => void;
  onEditMember?: (member: TeamMember) => void;
  onResendInvite?: (member: TeamMember) => void;
}

const TeamMemberTable: React.FC<TeamMemberTableProps> = ({
  teamMembers,
  onRemoveMember,
  onEditMember,
  onResendInvite
}) => {
  return (
    <div className="space-y-4">
      <ScrollArea className="h-[600px] rounded-md border">
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 bg-background border shadow-md">
                    {onEditMember && (
                      <DropdownMenuItem 
                        onClick={() => onEditMember(member)}
                        className="cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onResendInvite && member.invitation_status === 'invited' && (
                      <DropdownMenuItem 
                        onClick={() => onResendInvite(member)}
                        className="cursor-pointer text-blue-600 focus:text-blue-600"
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Re-send Invite
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => onRemoveMember(member)}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
      </ScrollArea>
    </div>
  );
};

export default TeamMemberTable;

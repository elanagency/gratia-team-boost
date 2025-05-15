import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trophy, Trash2, MoreHorizontal } from "lucide-react";
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  user_id: string;
  recognitionsReceived: number;
  recognitionsGiven: number;
  isPending?: boolean;
}
interface TeamMemberTableProps {
  teamMembers: TeamMember[];
  onRemoveMember: (member: TeamMember) => void;
}
const TeamMemberTable: React.FC<TeamMemberTableProps> = ({
  teamMembers,
  onRemoveMember
}) => {
  return <Table>
      <TableHeader>
        <TableRow className="border-gray-100">
          <TableHead className="text-gray-500">Name</TableHead>
          <TableHead className="text-gray-500">Email</TableHead>
          <TableHead className="text-gray-500">Role</TableHead>
          <TableHead className="text-gray-500">Recognitions</TableHead>
          <TableHead className="text-gray-500">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {teamMembers.length > 0 ? teamMembers.map(member => <TableRow key={member.id} className="border-gray-100">
              <TableCell className="font-medium">
                {member.name}
                {member.isPending && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    Pending
                  </span>}
              </TableCell>
              <TableCell className="text-gray-600">{member.email}</TableCell>
              <TableCell>
                <span className={`py-1 px-2 rounded-full text-xs ${member.role === "Admin" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                  {member.role}
                </span>
              </TableCell>
              <TableCell className="text-gray-600">
                <div className="flex items-center">
                  <Trophy className="h-4 w-4 text-amber-500 mr-1" />
                  <span>{member.recognitionsReceived} received</span>
                  <span className="mx-2">|</span>
                  <span>{member.recognitionsGiven} given</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500" onClick={() => onRemoveMember(member)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
                </div>
              </TableCell>
            </TableRow>) : <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
              No team members found. Invite your first team member!
            </TableCell>
          </TableRow>}
      </TableBody>
    </Table>;
};
export default TeamMemberTable;
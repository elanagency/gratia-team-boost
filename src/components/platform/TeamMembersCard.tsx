import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Plus, Crown, User, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MemberPointManagementDialog from "./MemberPointManagementDialog";
import DeleteUserDialog from "./DeleteUserDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Member {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  points: number;
  is_admin: boolean;
  role: string;
  department?: string;
  avatar_url?: string;
}

interface TeamMembersCardProps {
  companyId: string;
  companyName: string;
  members: Member[];
  onMemberPointsUpdated: () => void;
  onMemberDeleted: () => void;
}

const TeamMembersCard: React.FC<TeamMembersCardProps> = ({ 
  companyId, 
  companyName,
  members, 
  onMemberPointsUpdated,
  onMemberDeleted
}) => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<Member | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleManagePoints = (member: Member) => {
    setSelectedMember(member);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedMember(null);
  };

  const handleSuccess = () => {
    onMemberPointsUpdated();
  };

  const handleDeleteUser = (member: Member) => {
    setDeleteUser(member);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteUser) return;

    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-company-member', {
        body: {
          companyId,
          userId: deleteUser.user_id,
        }
      });

      if (error) throw error;

      toast.success(`${deleteUser.first_name} ${deleteUser.last_name} removed successfully`);
      onMemberDeleted();
      setIsDeleteDialogOpen(false);
      setDeleteUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to remove user');
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(member.first_name, member.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`flex items-center gap-1 w-fit ${
                          member.is_admin 
                            ? "bg-primary/10 text-primary border-primary/20" 
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {member.is_admin ? (
                          <>
                            <Crown className="h-3 w-3" />
                            Admin
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3" />
                            Member
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {member.department || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">
                          {member.points.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">pts</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleManagePoints(member)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Manage Points
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteUser(member)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No team members found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <MemberPointManagementDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        member={selectedMember}
        companyId={companyId}
        onSuccess={handleSuccess}
      />

      <DeleteUserDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        user={deleteUser}
        companyName={companyName}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </>
  );
};

export default TeamMembersCard;
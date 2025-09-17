
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { MoreHorizontal, Edit, Trash2, Mail, Check, X, UserCheck } from "lucide-react";
import { TeamMember } from "@/hooks/useTeamMembers";
import { getUserStatus } from "@/lib/userStatus";

interface TeamMemberTableProps {
  teamMembers: TeamMember[];
  onRemoveMember: (member: TeamMember) => void;
  onEditMember?: (member: TeamMember) => void;
  onResendInvite?: (member: TeamMember) => void;
  onReactivateMember?: (member: TeamMember) => void;
  currentPage?: number;
  totalPages?: number;
  totalMembers?: number;
  onPageChange?: (page: number) => void;
}

const TeamMemberTable: React.FC<TeamMemberTableProps> = ({
  teamMembers,
  onRemoveMember,
  onEditMember,
  onResendInvite,
  onReactivateMember,
  currentPage = 1,
  totalPages = 1,
  totalMembers = 0,
  onPageChange
}) => {
  const startIndex = (currentPage - 1) * 10 + 1;
  const endIndex = Math.min(currentPage * 10, totalMembers);
  return (
    <div className="space-y-4">
      {totalMembers > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {startIndex}-{endIndex} of {totalMembers} members
        </div>
      )}
      
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
                {(() => {
                  const status = getUserStatus(member.invitation_status, member.is_active);
                  const IconComponent = status.icon === 'check' ? Check : 
                                       status.icon === 'x' ? X : Mail;
                  
                  return (
                    <Badge 
                      variant={status.variant}
                      className={`${status.className} flex items-center gap-1 w-fit`}
                    >
                      <IconComponent className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  );
                })()}
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
                  <DropdownMenuContent align="end" className="w-48 bg-background border shadow-md">
                    {(() => {
                      const status = getUserStatus(member.invitation_status, member.is_active);
                      
                      return (
                        <>
                          {onEditMember && status.type !== 'deactivated' && (
                            <DropdownMenuItem 
                              onClick={() => onEditMember(member)}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          
                          {onResendInvite && status.type === 'invited' && (
                            <DropdownMenuItem 
                              onClick={() => onResendInvite(member)}
                              className="cursor-pointer text-blue-600 focus:text-blue-600"
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Resend Invite
                            </DropdownMenuItem>
                          )}
                          
                          {onReactivateMember && status.type === 'deactivated' && (
                            <DropdownMenuItem 
                              onClick={() => onReactivateMember(member)}
                              className="cursor-pointer text-green-600 focus:text-green-600"
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Reactivate
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem 
                            onClick={() => onRemoveMember(member)}
                            className="cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {status.type === 'deactivated' ? 'Remove Permanently' : 
                             status.type === 'active' ? 'Deactivate' : 'Remove'}
                          </DropdownMenuItem>
                        </>
                      );
                    })()}
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
      
      {totalPages > 1 && onPageChange && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) onPageChange(currentPage - 1);
                  }}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(page);
                    }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) onPageChange(currentPage + 1);
                  }}
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default TeamMemberTable;

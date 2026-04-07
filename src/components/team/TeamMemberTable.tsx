import React from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { MoreHorizontal, Edit, Trash2, Mail, UserCheck, ChevronRight } from "lucide-react";
import { type CompanyMember as TeamMember } from "@/hooks/useCompanyMembers";
import { getUserStatus } from "@/lib/userStatus";
import { format } from "date-fns";

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

const getInitials = (name: string) => {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] || "?").toUpperCase();
};

const avatarColors = [
  "#7F2BFE", "#E85D75", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"
];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

const getRoleLabel = (member: TeamMember) => {
  if (member.is_admin) return "Admin";
  return "Member";
};

const getRoleSubtitle = (member: TeamMember) => {
  if (member.is_admin) return "Account Owner";
  const dept = member.department;
  const role = member.role;
  if (role && role !== "user") return role;
  if (dept) return dept;
  return "Team Member";
};

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
  const headerStyle: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: 11,
    fontWeight: 600,
    color: "#9996AA",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    padding: "10px 16px",
    borderBottom: "1px solid #E8E6F0",
    background: "#FAFAFA",
  };

  const cellStyle: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: 13,
    color: "#6B6B80",
    padding: "12px 16px",
    borderBottom: "1px solid #F3F2F7",
    verticalAlign: "middle",
  };

  return (
    <div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...headerStyle, textAlign: "left", paddingLeft: 20 }}>Name ↑</th>
            <th style={{ ...headerStyle, textAlign: "left" }}>Email</th>
            <th style={{ ...headerStyle, textAlign: "left" }}>Department</th>
            <th style={{ ...headerStyle, textAlign: "left" }}>Birthday</th>
            <th style={{ ...headerStyle, textAlign: "left" }}>Start Date</th>
            <th style={{ ...headerStyle, textAlign: "left" }}>Role</th>
            <th style={{ ...headerStyle, width: 40 }}></th>
          </tr>
        </thead>
        <tbody>
          {teamMembers.length > 0 ? (
            teamMembers.map((member) => {
              const status = getUserStatus(member.status);
              return (
                <tr key={member.id} style={{ cursor: "pointer" }} className="hover:bg-[#FAFAFA] transition-colors">
                  <td style={{ ...cellStyle, paddingLeft: 20 }}>
                    <div className="flex items-center gap-3">
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: getAvatarColor(member.name),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 600,
                          fontFamily: "Inter, sans-serif",
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#0F0533" }}>
                          {member.name}
                        </div>
                        <div style={{ fontSize: 11, color: "#9996AA" }}>
                          {getRoleSubtitle(member)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={cellStyle}>{member.email}</td>
                  <td style={cellStyle}>{member.department || "—"}</td>
                  <td style={cellStyle}>
                    {member.birthday ? format(new Date(member.birthday + 'T00:00:00'), 'MMM d') : '—'}
                  </td>
                  <td style={cellStyle}>
                    {member.company_start_date ? format(new Date(member.company_start_date + 'T00:00:00'), 'MMM d, yyyy') : '—'}
                  </td>
                  <td style={cellStyle}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#7F2BFE" }}>
                      {getRoleLabel(member)}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, padding: "12px 12px 12px 4px" }}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 4,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <ChevronRight size={16} color="#9996AA" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-background border shadow-md">
                        {onEditMember && status.type !== 'deactivated' && (
                          <DropdownMenuItem onClick={() => onEditMember(member)} className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {onResendInvite && status.type === 'invited' && (
                          <DropdownMenuItem onClick={() => onResendInvite(member)} className="cursor-pointer text-blue-600 focus:text-blue-600">
                            <Mail className="mr-2 h-4 w-4" />
                            Resend Invite
                          </DropdownMenuItem>
                        )}
                        {onReactivateMember && status.type === 'deactivated' && (
                          <DropdownMenuItem onClick={() => onReactivateMember(member)} className="cursor-pointer text-green-600 focus:text-green-600">
                            <UserCheck className="mr-2 h-4 w-4" />
                            Reactivate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onRemoveMember(member)} className="cursor-pointer text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          {status.type === 'deactivated' ? 'Remove Permanently' :
                           status.type === 'active' ? 'Deactivate' : 'Remove'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={7} style={{ ...cellStyle, textAlign: "center", padding: 40, color: "#9996AA" }}>
                No team members found. Invite your first team member!
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && onPageChange && (
        <div className="flex justify-center py-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); if (currentPage > 1) onPageChange(currentPage - 1); }}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => { e.preventDefault(); onPageChange(page); }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) onPageChange(currentPage + 1); }}
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

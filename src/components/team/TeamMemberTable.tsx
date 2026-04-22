import React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, Trash2, Mail, UserCheck, ChevronRight, ChevronLeft } from "lucide-react";
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
  if (dept) return dept;
  return "Team Member";
};

const PAGE_SIZE = 10;

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
  const startItem = (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, totalMembers);

  const headerStyle: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: 11,
    fontWeight: 500,
    color: "#9996AA",
    textTransform: "uppercase",
    letterSpacing: "0.44px",
    lineHeight: "16.5px",
    padding: "7.5px 11.25px",
    background: "#F5F5F7",
    borderBottom: "1px solid #E8E6F0",
  };

  const cellStyle: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: 13,
    color: "#6B6B80",
    padding: "10px 11.25px",
    borderBottom: "1px solid #F3F2F7",
    verticalAlign: "middle",
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div
      style={{
        borderRadius: 13.375,
        border: "1px solid #E8E6F0",
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...headerStyle, textAlign: "left", paddingLeft: 16, borderTopLeftRadius: 13.375 }}>Name ↑</th>
            <th style={{ ...headerStyle, textAlign: "left" }}>Email</th>
            <th style={{ ...headerStyle, textAlign: "left" }}>Department</th>
            <th style={{ ...headerStyle, textAlign: "left" }}>Birthday</th>
            <th style={{ ...headerStyle, textAlign: "left" }}>Start Date</th>
            <th style={{ ...headerStyle, textAlign: "left" }}>Role</th>
            <th style={{ ...headerStyle, width: 40, borderTopRightRadius: 13.375 }}></th>
          </tr>
        </thead>
        <tbody>
          {teamMembers.length > 0 ? (
            teamMembers.map((member, idx) => {
              const status = getUserStatus(member.status);
              const isLast = idx === teamMembers.length - 1;
              return (
                <tr key={member.id} style={{ cursor: "pointer", background: "#fff" }} className="hover:bg-[#FAFAFA] transition-colors">
                  <td style={{ ...cellStyle, paddingLeft: 16, borderBottom: isLast ? "none" : cellStyle.borderBottom }}>
                    <div className="flex items-center gap-3">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.name}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
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
                      )}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#0F0533", lineHeight: "19.5px" }}>
                          {member.name}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 400, color: "#9996AA", lineHeight: "16.5px" }}>
                          {getRoleSubtitle(member)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...cellStyle, borderBottom: isLast ? "none" : cellStyle.borderBottom }}>{member.email}</td>
                  <td style={{ ...cellStyle, borderBottom: isLast ? "none" : cellStyle.borderBottom }}>{member.department || "—"}</td>
                  <td style={{ ...cellStyle, borderBottom: isLast ? "none" : cellStyle.borderBottom }}>
                    {member.birthday ? format(new Date(member.birthday + 'T00:00:00'), 'MMM d') : '—'}
                  </td>
                  <td style={{ ...cellStyle, borderBottom: isLast ? "none" : cellStyle.borderBottom }}>
                    {member.company_start_date ? format(new Date(member.company_start_date + 'T00:00:00'), 'MMM d, yyyy') : '—'}
                  </td>
                  <td style={{ ...cellStyle, borderBottom: isLast ? "none" : cellStyle.borderBottom }}>
                    <span
                      style={{
                        display: "inline-block",
                        borderRadius: 9999,
                        background: "rgba(252, 91, 255, 0.10)",
                        color: member.is_admin ? "#FC5BFF" : "#7F2BFE",
                        fontSize: 11,
                        fontWeight: 500,
                        padding: "3px 10px",
                        lineHeight: "16.5px",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {getRoleLabel(member)}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, padding: "10px 12px 10px 4px", borderBottom: isLast ? "none" : cellStyle.borderBottom }}>
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
              <td colSpan={7} style={{ ...cellStyle, textAlign: "center", padding: 40, color: "#9996AA", borderBottom: "none" }}>
                No team members found. Invite your first team member!
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination footer */}
      {totalMembers > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            borderTop: "1px solid #E8E6F0",
            fontFamily: "Inter, sans-serif",
            fontSize: 12,
            color: "#9996AA",
          }}
        >
          <span>
            Showing {startItem}-{endItem} of {totalMembers}
          </span>
          {totalPages > 1 && onPageChange && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: "1px solid #E8E6F0",
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                  opacity: currentPage <= 1 ? 0.4 : 1,
                }}
              >
                <ChevronLeft size={14} color="#6B6B80" />
              </button>
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: currentPage === page ? "none" : "1px solid #E8E6F0",
                    background: currentPage === page ? "#7F2BFE" : "#fff",
                    color: currentPage === page ? "#fff" : "#6B6B80",
                    fontSize: 12,
                    fontWeight: 500,
                    fontFamily: "Inter, sans-serif",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: "1px solid #E8E6F0",
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                  opacity: currentPage >= totalPages ? 0.4 : 1,
                }}
              >
                <ChevronRight size={14} color="#6B6B80" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamMemberTable;

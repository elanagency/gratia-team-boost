
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Eye, Users, Calendar, CreditCard, ChevronDown, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CompanyDetailsCard from "@/components/platform/CompanyDetailsCard";
import TeamMembersCard from "@/components/platform/TeamMembersCard";

const CompaniesManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

  const { data: companies, isLoading, refetch: refetchCompanies } = useQuery({
    queryKey: ['platform-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          company_members(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Query for expanded company members
  const { data: expandedCompanyMembers, isLoading: isMembersLoading, refetch: refetchMembers } = useQuery({
    queryKey: ['company-members', expandedCompany],
    queryFn: async () => {
      if (!expandedCompany) return [];
      
      // Get company members first
      const { data: members, error: membersError } = await supabase
        .from('company_members')
        .select(`
          user_id,
          points,
          is_admin,
          role,
          department
        `)
        .eq('company_id', expandedCompany);

      if (membersError) throw membersError;
      if (!members || members.length === 0) return [];

      // Get user profiles separately
      const userIds = members.map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Failed to fetch profiles:', profilesError);
      }

      // Get user emails from the edge function
      const { data: emailData, error: emailError } = await supabase.functions.invoke(
        'get-user-emails',
        { body: { userIds } }
      );

      if (emailError) {
        console.error('Failed to fetch emails:', emailError);
        // Continue without emails rather than failing completely
      }

      // Create profile lookup
      const profileLookup = profiles?.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};

      // Combine member data with profiles and emails
      return members.map(member => {
        const profile = profileLookup[member.user_id];
        return {
          user_id: member.user_id,
          first_name: profile?.first_name || 'Unknown',
          last_name: profile?.last_name || 'User',
          email: emailData?.emails?.[member.user_id] || 'No email',
          points: member.points,
          is_admin: member.is_admin,
          role: member.role,
          department: member.department,
          avatar_url: profile?.avatar_url,
        };
      });
    },
    enabled: !!expandedCompany,
  });

  const filteredCompanies = companies?.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCompanyClick = (companyId: string) => {
    setExpandedCompany(expandedCompany === companyId ? null : companyId);
  };

  const handleMemberPointsUpdated = () => {
    refetchMembers();
    refetchCompanies();
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      suspended: "bg-red-100 text-red-800",
    };
    
    return (
      <Badge variant="outline" className={variants[status] || variants.inactive}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies Management</h1>
          <p className="text-gray-600">Manage all companies on the platform</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by company name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Companies ({filteredCompanies?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Team Size</TableHead>
                  <TableHead>Points Balance</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies?.map((company) => (
                  <React.Fragment key={company.id}>
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleCompanyClick(company.id)}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center">
                            {expandedCompany === company.id ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground mr-2" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground mr-2" />
                            )}
                          </div>
                          {company.logo_url ? (
                            <img 
                              src={company.logo_url} 
                              alt={company.name}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-[#F572FF] rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {company.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{company.name}</p>
                            {company.website && (
                              <p className="text-sm text-gray-500">{company.website}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(company.subscription_status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{company.company_members?.[0]?.count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                          <span>{company.points_balance.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {new Date(company.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompanyClick(company.id);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedCompany === company.id && (
                      <TableRow>
                        <TableCell colSpan={6} className="p-0">
                          <div className="p-6 bg-muted/20 space-y-6">
                            <CompanyDetailsCard company={company} members={expandedCompanyMembers || []} />
                            {isMembersLoading ? (
                              <Card>
                                <CardContent className="p-6">
                                  <div className="space-y-2">
                                    {[...Array(3)].map((_, i) => (
                                      <div key={i} className="animate-pulse h-12 bg-gray-200 rounded"></div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            ) : (
                              <TeamMembersCard
                                companyId={company.id}
                                members={expandedCompanyMembers || []}
                                onMemberPointsUpdated={handleMemberPointsUpdated}
                              />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompaniesManagement;

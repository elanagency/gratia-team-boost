import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, MapPin, Calendar, CreditCard, Users, DollarSign } from "lucide-react";

interface Company {
  id: string;
  name: string;
  logo_url?: string;
  website?: string;
  address?: string;
  created_at: string;
  subscription_status: string;
  team_slots: number;
  points_balance: number;
  team_member_monthly_limit: number;
  billing_cycle_anchor?: number;
  company_members?: Array<{ count: number }>;
}

interface Member {
  user_id: string;
  points: number;
}

interface CompanyDetailsCardProps {
  company: Company;
  members?: Member[];
}

const CompanyDetailsCard: React.FC<CompanyDetailsCardProps> = ({ company, members = [] }) => {
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

  const teamMemberCount = company.company_members?.[0]?.count || 0;
  const totalUserPoints = members.reduce((sum, member) => sum + (member.points || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Company Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Company Header */}
        <div className="flex items-start gap-4">
          {company.logo_url ? (
            <img 
              src={company.logo_url} 
              alt={company.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-[#F572FF] rounded-lg flex items-center justify-center">
              <span className="text-white text-lg font-bold">
                {company.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-xl font-semibold">{company.name}</h3>
            {company.website && (
              <div className="flex items-center gap-1 mt-1">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={company.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {company.website}
                </a>
              </div>
            )}
            {company.address && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{company.address}</span>
              </div>
            )}
          </div>
          <div className="text-right">
            {getStatusBadge(company.subscription_status)}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Points</span>
            </div>
            <p className="text-2xl font-bold">{totalUserPoints.toLocaleString()}</p>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Users</span>
            </div>
            <p className="text-2xl font-bold">{teamMemberCount}</p>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Monthly Limit</span>
            </div>
            <p className="text-2xl font-bold">{company.team_member_monthly_limit}</p>
            <p className="text-xs text-muted-foreground">per member</p>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Created</span>
            </div>
            <p className="text-sm font-medium">
              {new Date(company.created_at).toLocaleDateString()}
            </p>
            {company.billing_cycle_anchor && (
              <p className="text-xs text-muted-foreground">
                Billing: Day {company.billing_cycle_anchor}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyDetailsCard;
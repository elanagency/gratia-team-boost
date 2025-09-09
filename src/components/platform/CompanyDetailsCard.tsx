import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Building2, Globe, MapPin, Calendar, CreditCard, Users, Receipt, TestTube, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  stripe_subscription_id?: string;
  environment?: string;
  company_members?: Array<{ count: number }>;
}

interface Member {
  user_id: string;
  points: number;
}

interface CompanyDetailsCardProps {
  company: Company;
  members?: Member[];
  onCompanyUpdated?: () => void;
}

const CompanyDetailsCard: React.FC<CompanyDetailsCardProps> = ({ company, members = [], onCompanyUpdated }) => {
  const [showLiveConfirmation, setShowLiveConfirmation] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
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
  
  const currentEnvironment = company.environment || 'live';
  const isLiveMode = currentEnvironment === 'live';

  const handleEnvironmentToggle = (checked: boolean) => {
    if (checked) {
      setShowLiveConfirmation(true);
    } else {
      updateEnvironment('test');
    }
  };

  const updateEnvironment = async (environment: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ environment: environment })
        .eq('id', company.id);

      if (error) throw error;

      toast.success(`Environment updated to ${environment} mode`);
      onCompanyUpdated?.();
    } catch (error) {
      console.error('Error updating environment:', error);
      toast.error('Failed to update environment');
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmLiveMode = () => {
    updateEnvironment('live');
    setShowLiveConfirmation(false);
  };

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

        {/* Environment Control */}
        <div className="border rounded-lg p-4 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">
                  Environment: {' '}
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                    isLiveMode 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {isLiveMode ? (
                      <>
                        <Globe className="h-3 w-3" />
                        Live
                      </>
                    ) : (
                      <>
                        <TestTube className="h-3 w-3" />
                        Test
                      </>
                    )}
                  </span>
                </h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {isLiveMode 
                  ? 'Company is using live environment for real transactions'
                  : 'Company is using test environment for testing'
                }
              </p>
              {isLiveMode && (
                <div className="flex items-center gap-1 text-sm text-orange-600">
                  <AlertTriangle className="h-4 w-4" />
                  Live mode processes real transactions
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Test</span>
              <Switch
                checked={isLiveMode}
                onCheckedChange={handleEnvironmentToggle}
                disabled={isUpdating}
              />
              <span className="text-sm font-medium text-muted-foreground">Live</span>
            </div>
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
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Stripe Subscription</span>
            </div>
            {company.stripe_subscription_id ? (
              <p className="text-sm font-mono break-all">{company.stripe_subscription_id}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No subscription</p>
            )}
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

        <AlertDialog open={showLiveConfirmation} onOpenChange={setShowLiveConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Switch {company.name} to Live Mode?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will switch this company to use live environment settings for all integrations. 
                Real transactions will be processed and charges will be made to actual payment methods for this company.
                <br /><br />
                Are you sure you want to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmLiveMode}
                className="bg-orange-600 hover:bg-orange-700"
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Yes, Switch to Live'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default CompanyDetailsCard;
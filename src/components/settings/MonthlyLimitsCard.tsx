
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";

export const MonthlyLimitsCard = () => {
  const { companyId } = useAuth();
  const [monthlyLimit, setMonthlyLimit] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [teamMemberCount, setTeamMemberCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    if (!companyId) return;
    
    try {
      // Get current monthly limit
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('team_member_monthly_limit')
        .eq('id', companyId)
        .single();
      
      if (companyError) throw companyError;
      
      setMonthlyLimit(companyData?.team_member_monthly_limit || 0);

      // Get team member count (non-admin members)
      const { count, error: countError } = await supabase
        .from('company_members')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('is_admin', false);
      
      if (countError) throw countError;
      
      setTeamMemberCount(count || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load monthly limit settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!companyId) return;
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('companies')
        .update({ team_member_monthly_limit: monthlyLimit })
        .eq('id', companyId);
      
      if (error) throw error;
      
      toast.success("Monthly spending limit updated successfully");
    } catch (error) {
      console.error("Error updating monthly limit:", error);
      toast.error("Failed to update monthly limit");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Member Monthly Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Member Monthly Limits
        </CardTitle>
        <CardDescription>
          Set a universal monthly spending limit for all team members. This controls how many points each team member can give to others per month.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-3 rounded-md">
          <p className="text-sm text-blue-700">
            <strong>{teamMemberCount}</strong> team members will be affected by this limit
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="monthly-limit">Monthly Point Limit per Team Member</Label>
          <div className="flex gap-2">
            <Input
              id="monthly-limit"
              type="number"
              min="0"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(parseInt(e.target.value) || 0)}
              placeholder="Enter monthly limit"
              className="flex-1"
            />
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Set to 0 to disable monthly limits for team members
          </p>
        </div>

        <div className="bg-gray-50 p-3 rounded-md">
          <h4 className="font-medium text-sm mb-2">Current Setting:</h4>
          <p className="text-sm text-gray-600">
            {monthlyLimit > 0 
              ? `Each team member can give up to ${monthlyLimit} points per month`
              : "No monthly limits set - team members can give unlimited points"
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

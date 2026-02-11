import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Cake, CalendarHeart, Wallet, Info } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useSearchParams } from "react-router-dom";
import BuyPointsDialog from "./BuyPointsDialog";

const CelebrationSettingsCard = () => {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const { pointExchangeRate } = usePlatformSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Handle post-purchase verification
  useEffect(() => {
    const purchaseStatus = searchParams.get("points_purchase");
    const sessionId = searchParams.get("session_id");

    if (purchaseStatus === "success" && sessionId && !verifying) {
      setVerifying(true);
      (async () => {
        try {
          const response = await supabase.functions.invoke("verify-stripe-session", {
            body: { sessionId },
          });

          if (response.error) throw new Error(response.error.message);

          const data = response.data;
          if (data?.success || data?.type === "points_purchase") {
            toast.success(`${data.pointsCredited?.toLocaleString() || ""} points added to your wallet!`);
            queryClient.invalidateQueries({ queryKey: ["company-celebration-settings"] });
          } else {
            toast.error("Purchase verification failed");
          }
        } catch (err: any) {
          console.error("Verification error:", err);
          toast.error("Failed to verify purchase");
        } finally {
          setVerifying(false);
          // Clean URL params
          searchParams.delete("points_purchase");
          searchParams.delete("session_id");
          setSearchParams(searchParams, { replace: true });
        }
      })();
    } else if (purchaseStatus === "cancelled") {
      toast.info("Purchase cancelled");
      searchParams.delete("points_purchase");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

  // Fetch company celebration settings
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["company-celebration-settings", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("birthday_rewards_enabled, birthday_reward_points, anniversary_rewards_enabled, anniversary_reward_points, points_balance")
        .eq("id", companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch active member count
  const { data: memberCount } = useQuery({
    queryKey: ["company-active-member-count", companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      const { count, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("status", "active");
      if (error) throw error;
      return count || 0;
    },
    enabled: !!companyId,
  });

  // Fetch yearly summary stats
  const { data: yearlyStats } = useQuery({
    queryKey: ["celebration-yearly-stats", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const currentYear = new Date().getFullYear();
      const { data, error } = await supabase
        .from("celebration_rewards_log")
        .select("reward_type, points_awarded")
        .eq("company_id", companyId)
        .eq("year", currentYear);
      if (error) throw error;

      const stats = { birthday_count: 0, anniversary_count: 0, birthday_points: 0, anniversary_points: 0, total_points: 0 };
      data?.forEach((r) => {
        if (r.reward_type === "birthday") {
          stats.birthday_count++;
          stats.birthday_points += r.points_awarded;
        } else {
          stats.anniversary_count++;
          stats.anniversary_points += r.points_awarded;
        }
        stats.total_points += r.points_awarded;
      });
      return stats;
    },
    enabled: !!companyId,
  });

  // Fetch recent celebration logs (expanded to 50)
  const { data: recentLogs } = useQuery({
    queryKey: ["celebration-logs", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("celebration_rewards_log")
        .select("id, reward_type, points_awarded, event_date, year, created_at, profile_id")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      if (!data?.length) return [];
      const profileIds = [...new Set(data.map((l) => l.profile_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", profileIds);

      const nameMap: Record<string, string> = {};
      profiles?.forEach((p) => {
        nameMap[p.id] = `${p.first_name} ${p.last_name}`.trim();
      });

      return data.map((log) => ({
        ...log,
        employee_name: nameMap[log.profile_id] || "Unknown",
      }));
    },
    enabled: !!companyId,
  });

  // Local state
  const [birthdayEnabled, setBirthdayEnabled] = useState(false);
  const [birthdayPoints, setBirthdayPoints] = useState("0");
  const [anniversaryEnabled, setAnniversaryEnabled] = useState(false);
  const [anniversaryPoints, setAnniversaryPoints] = useState("0");

  useEffect(() => {
    if (company) {
      setBirthdayEnabled(company.birthday_rewards_enabled);
      setBirthdayPoints(String(company.birthday_reward_points));
      setAnniversaryEnabled(company.anniversary_rewards_enabled);
      setAnniversaryPoints(String(company.anniversary_reward_points));
    }
  }, [company]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("No company");
      const { error } = await supabase
        .from("companies")
        .update({
          birthday_rewards_enabled: birthdayEnabled,
          birthday_reward_points: parseInt(birthdayPoints) || 0,
          anniversary_rewards_enabled: anniversaryEnabled,
          anniversary_reward_points: parseInt(anniversaryPoints) || 0,
        })
        .eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-celebration-settings"] });
      toast.success("Celebration settings saved");
    },
    onError: () => toast.error("Failed to save settings"),
  });

  // Cost estimator
  const rate = pointExchangeRate || 0.05;
  const employees = memberCount || 0;
  const bPts = parseInt(birthdayPoints) || 0;
  const aPts = parseInt(anniversaryPoints) || 0;
  const birthdayAnnualPts = birthdayEnabled ? bPts * employees : 0;
  const anniversaryAnnualPts = anniversaryEnabled ? aPts * employees : 0;
  const totalAnnualPts = birthdayAnnualPts + anniversaryAnnualPts;
  const totalAnnualCost = totalAnnualPts * rate;
  const walletBalance = company?.points_balance || 0;
  const walletValue = walletBalance * rate;

  const hasChanges =
    company &&
    (birthdayEnabled !== company.birthday_rewards_enabled ||
      parseInt(birthdayPoints) !== company.birthday_reward_points ||
      anniversaryEnabled !== company.anniversary_rewards_enabled ||
      parseInt(anniversaryPoints) !== company.anniversary_reward_points);

  if (companyLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading celebration settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cake className="h-5 w-5 text-primary" />
            Celebration Rewards
          </CardTitle>
          <CardDescription>
            Automatically reward team members on their birthday or work anniversary. Points are deducted from your company wallet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Birthday Rewards */}
          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <Switch checked={birthdayEnabled} onCheckedChange={setBirthdayEnabled} />
                <Label className="text-base font-medium">Birthday Rewards</Label>
              </div>
              {birthdayEnabled && (
                <div className="flex items-center gap-2 pl-14">
                  <Label htmlFor="birthday-points" className="text-sm text-muted-foreground whitespace-nowrap">
                    Points per birthday:
                  </Label>
                  <Input
                    id="birthday-points"
                    type="number"
                    min="1"
                    className="w-24"
                    value={birthdayPoints}
                    onChange={(e) => setBirthdayPoints(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Anniversary Rewards */}
          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <Switch checked={anniversaryEnabled} onCheckedChange={setAnniversaryEnabled} />
                <Label className="text-base font-medium">Work Anniversary Rewards</Label>
              </div>
              {anniversaryEnabled && (
                <div className="flex items-center gap-2 pl-14">
                  <Label htmlFor="anniversary-points" className="text-sm text-muted-foreground whitespace-nowrap">
                    Points per anniversary:
                  </Label>
                  <Input
                    id="anniversary-points"
                    type="number"
                    min="1"
                    className="w-24"
                    value={anniversaryPoints}
                    onChange={(e) => setAnniversaryPoints(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <Button onClick={() => saveMutation.mutate()} disabled={!hasChanges || saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Cost Estimator & Wallet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Cost Estimator & Company Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm font-mono space-y-1">
            {birthdayEnabled && (
              <div className="flex justify-between">
                <span>Birthday Rewards:</span>
                <span>
                  {bPts} pts × {employees} employees = {birthdayAnnualPts.toLocaleString()} pts/year = ${(birthdayAnnualPts * rate).toFixed(2)}/year
                </span>
              </div>
            )}
            {anniversaryEnabled && (
              <div className="flex justify-between">
                <span>Anniversary Rewards:</span>
                <span>
                  {aPts} pts × {employees} employees = {anniversaryAnnualPts.toLocaleString()} pts/year = ${(anniversaryAnnualPts * rate).toFixed(2)}/year
                </span>
              </div>
            )}
            {(birthdayEnabled || anniversaryEnabled) && (
              <>
                <div className="border-t border-border my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Estimated Annual Total:</span>
                  <span>
                    {totalAnnualPts.toLocaleString()} pts = ${totalAnnualCost.toFixed(2)}
                  </span>
                </div>
              </>
            )}
            {!birthdayEnabled && !anniversaryEnabled && (
              <p className="text-muted-foreground">Enable birthday or anniversary rewards above to see cost estimates.</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Company Wallet Balance</p>
              <p className="text-2xl font-bold">{walletBalance.toLocaleString()} pts</p>
              <p className="text-sm text-muted-foreground">${walletValue.toFixed(2)} value</p>
            </div>
            <Button onClick={() => setBuyDialogOpen(true)} disabled={verifying}>
              {verifying ? "Verifying purchase..." : "Buy Points"}
            </Button>
          </div>

          {(birthdayEnabled || anniversaryEnabled) && walletBalance < totalAnnualPts && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <Info className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-destructive">
                Your wallet balance ({walletBalance.toLocaleString()} pts) may not cover the estimated annual cost ({totalAnnualPts.toLocaleString()} pts). Top up your wallet to ensure uninterrupted rewards.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Yearly Summary Stats */}
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarHeart className="h-5 w-5 text-primary" />
              {new Date().getFullYear()} Celebration Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold">{(yearlyStats?.total_points || 0).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Points Distributed</p>
                <p className="text-xs text-muted-foreground">${((yearlyStats?.total_points || 0) * rate).toFixed(2)} value</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold">{yearlyStats?.birthday_count || 0}</p>
                <p className="text-sm text-muted-foreground">🎂 Birthday Rewards</p>
                <p className="text-xs text-muted-foreground">{(yearlyStats?.birthday_points || 0).toLocaleString()} pts</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold">{yearlyStats?.anniversary_count || 0}</p>
                <p className="text-sm text-muted-foreground">🎉 Anniversary Rewards</p>
              <p className="text-xs text-muted-foreground">{(yearlyStats?.anniversary_points || 0).toLocaleString()} pts</p>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Recent Reward History */}
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarHeart className="h-5 w-5 text-primary" />
              Celebration Rewards History
            </CardTitle>
            <CardDescription>
              Last {recentLogs.length} celebration rewards distributed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.employee_name}</TableCell>
                    <TableCell>
                      {log.reward_type === "birthday" ? "🎂 Birthday" : "🎉 Anniversary"}
                    </TableCell>
                    <TableCell>{log.points_awarded}</TableCell>
                    <TableCell className="text-muted-foreground">${(log.points_awarded * rate).toFixed(2)}</TableCell>
                    <TableCell>{format(new Date(log.created_at), "MMM d, yyyy")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(!recentLogs || recentLogs.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No celebration rewards distributed yet
                </TableCell>
              </TableRow>
            )}
          </CardContent>
        </Card>

      {/* Buy Points Dialog */}
      {companyId && (
        <BuyPointsDialog
          open={buyDialogOpen}
          onOpenChange={setBuyDialogOpen}
          companyId={companyId}
          exchangeRate={rate}
        />
      )}
    </div>
  );
};

export default CelebrationSettingsCard;

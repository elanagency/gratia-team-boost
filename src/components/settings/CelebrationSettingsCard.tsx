import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Info } from "lucide-react";
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

  const rate = pointExchangeRate || 0.05;

  // Handle post-purchase verification
  useEffect(() => {
    const purchaseStatus = searchParams.get("points_purchase");
    const sessionId = searchParams.get("session_id");
    if (purchaseStatus === "success" && sessionId && !verifying) {
      setVerifying(true);
      (async () => {
        try {
          const response = await supabase.functions.invoke("verify-stripe-session", { body: { sessionId } });
          if (response.error) throw new Error(response.error.message);
          const data = response.data;
          if (data?.success || data?.type === "points_purchase") {
            toast.success(`${data.pointsCredited?.toLocaleString() || ""} points added to your wallet!`);
            queryClient.invalidateQueries({ queryKey: ["company-celebration-settings"] });
          } else { toast.error("Purchase verification failed"); }
        } catch (err: any) { console.error("Verification error:", err); toast.error("Failed to verify purchase"); }
        finally {
          setVerifying(false);
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

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["company-celebration-settings", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase.from("companies").select("birthday_rewards_enabled, birthday_reward_points, anniversary_rewards_enabled, anniversary_reward_points, points_balance").eq("id", companyId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: memberCount } = useQuery({
    queryKey: ["company-member-count", companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      const { count, error } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("company_id", companyId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!companyId,
  });

  const { data: yearlyStats } = useQuery({
    queryKey: ["celebration-yearly-stats", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const currentYear = new Date().getFullYear();
      const { data, error } = await supabase.from("celebration_rewards_log").select("reward_type, points_awarded").eq("company_id", companyId).eq("year", currentYear);
      if (error) throw error;
      const stats = { birthday_count: 0, anniversary_count: 0, birthday_points: 0, anniversary_points: 0, total_points: 0 };
      data?.forEach((r) => {
        if (r.reward_type === "birthday") { stats.birthday_count++; stats.birthday_points += r.points_awarded; }
        else { stats.anniversary_count++; stats.anniversary_points += r.points_awarded; }
        stats.total_points += r.points_awarded;
      });
      return stats;
    },
    enabled: !!companyId,
  });

  const { data: recentLogs } = useQuery({
    queryKey: ["celebration-logs", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from("celebration_rewards_log").select("id, reward_type, points_awarded, event_date, year, created_at, profile_id").eq("company_id", companyId).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      if (!data?.length) return [];
      const profileIds = [...new Set(data.map((l) => l.profile_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, first_name, last_name").in("id", profileIds);
      const nameMap: Record<string, string> = {};
      profiles?.forEach((p) => { nameMap[p.id] = `${p.first_name} ${p.last_name}`.trim(); });
      return data.map((log) => ({ ...log, employee_name: nameMap[log.profile_id] || "Unknown" }));
    },
    enabled: !!companyId,
  });

  const [birthdayEnabled, setBirthdayEnabled] = useState(false);
  const [birthdayDollars, setBirthdayDollars] = useState("0");
  const [anniversaryEnabled, setAnniversaryEnabled] = useState(false);
  const [anniversaryDollars, setAnniversaryDollars] = useState("0");

  useEffect(() => {
    if (company) {
      setBirthdayEnabled(company.birthday_rewards_enabled);
      setBirthdayDollars((company.birthday_reward_points * rate).toFixed(2));
      setAnniversaryEnabled(company.anniversary_rewards_enabled);
      setAnniversaryDollars((company.anniversary_reward_points * rate).toFixed(2));
    }
  }, [company, rate]);

  const dollarsToPoints = (dollars: string) => Math.round((parseFloat(dollars) || 0) / rate);
  const birthdayPointsCalc = dollarsToPoints(birthdayDollars);
  const anniversaryPointsCalc = dollarsToPoints(anniversaryDollars);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("No company");
      const { error } = await supabase.from("companies").update({
        birthday_rewards_enabled: birthdayEnabled,
        birthday_reward_points: birthdayPointsCalc,
        anniversary_rewards_enabled: anniversaryEnabled,
        anniversary_reward_points: anniversaryPointsCalc,
      }).eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-celebration-settings"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-progress"] });
      toast.success("Celebration settings saved");
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const employees = memberCount || 0;
  const birthdayAnnualPts = birthdayEnabled ? birthdayPointsCalc * employees : 0;
  const anniversaryAnnualPts = anniversaryEnabled ? anniversaryPointsCalc * employees : 0;
  const totalAnnualPts = birthdayAnnualPts + anniversaryAnnualPts;
  const walletBalance = company?.points_balance || 0;
  const walletValue = walletBalance * rate;

  const hasChanges =
    company &&
    (birthdayEnabled !== company.birthday_rewards_enabled ||
      birthdayPointsCalc !== company.birthday_reward_points ||
      anniversaryEnabled !== company.anniversary_rewards_enabled ||
      anniversaryPointsCalc !== company.anniversary_reward_points);

  const labelStyle: React.CSSProperties = { fontSize: 13, color: "#9996AA", fontFamily: "Inter, sans-serif" };

  if (companyLoading) {
    return (
      <div style={{ fontFamily: "Inter, sans-serif", border: "1px solid #E8E6F0", borderRadius: 15, padding: 20 }}>
        <p style={labelStyle}>Loading celebration settings...</p>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: 14,
    height: 38,
    borderRadius: 13.375,
    borderColor: "#E8E6F0",
    backgroundColor: "#F5F5F7",
    paddingLeft: 28,
    width: 120,
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Main config card */}
      <div style={{ border: "1px solid #E8E6F0", borderRadius: 15, padding: 20, background: "#fff" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F0533", marginBottom: 2 }}>Automated Celebrations</h2>
        <p style={{ ...labelStyle, marginBottom: 24 }}>Configure automatic recognition for special events</p>

        {/* Birthdays */}
        <div style={{ marginBottom: 24 }}>
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F0533", marginBottom: 2 }}>Birthdays</h3>
              <p style={{ fontSize: 12, color: "#9996AA" }}>Automatically celebrate team birthdays</p>
            </div>
            <Switch checked={birthdayEnabled} onCheckedChange={setBirthdayEnabled} />
          </div>
          {birthdayEnabled && (
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, color: "#9996AA", display: "block", marginBottom: 6 }}>Reward amount per employee</label>
              <div className="relative" style={{ width: 120 }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#9996AA" }}>$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={birthdayDollars}
                  onChange={(e) => setBirthdayDollars(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          )}
        </div>

        {/* Work Anniversaries */}
        <div style={{ marginBottom: 24 }}>
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F0533", marginBottom: 2 }}>Work Anniversaries</h3>
              <p style={{ fontSize: 12, color: "#9996AA" }}>Celebrate work milestones</p>
            </div>
            <Switch checked={anniversaryEnabled} onCheckedChange={setAnniversaryEnabled} />
          </div>
          {anniversaryEnabled && (
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, color: "#9996AA", display: "block", marginBottom: 6 }}>Reward amount per employee</label>
              <div className="relative" style={{ width: 120 }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#9996AA" }}>$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={anniversaryDollars}
                  onChange={(e) => setAnniversaryDollars(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={() => saveMutation.mutate()}
          disabled={!hasChanges || saveMutation.isPending}
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            fontWeight: 500,
            height: 38,
            paddingLeft: 24,
            paddingRight: 24,
            borderRadius: 13.375,
            border: "none",
            background: hasChanges ? "linear-gradient(135deg, #7F2BFE, #FC5BFF)" : "#E8E6F0",
            color: hasChanges ? "#fff" : "#9996AA",
            cursor: hasChanges ? "pointer" : "not-allowed",
          }}
        >
          {saveMutation.isPending ? "Saving..." : "Save changes"}
        </button>

        {/* Wallet info */}
        <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: 13.375, background: "#F5F5F7", border: "1px solid #E8E6F0" }}>
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#0F0533" }}>Company Wallet</p>
              <p style={{ fontSize: 12, color: "#9996AA" }}>{walletBalance.toLocaleString()} pts · ${walletValue.toFixed(2)} value</p>
            </div>
            <button
              onClick={() => setBuyDialogOpen(true)}
              disabled={verifying}
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 500,
                height: 32,
                paddingLeft: 16,
                paddingRight: 16,
                borderRadius: 9.375,
                border: "1px solid #E8E6F0",
                background: "#fff",
                color: "#0F0533",
                cursor: "pointer",
              }}
            >
              {verifying ? "Verifying..." : "Buy Points"}
            </button>
          </div>
          {(birthdayEnabled || anniversaryEnabled) && walletBalance < totalAnnualPts && (
            <div className="flex items-start gap-2 mt-3" style={{ fontSize: 12, color: "#E53E3E" }}>
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>Wallet may not cover annual cost ({totalAnnualPts.toLocaleString()} pts). Top up to ensure uninterrupted rewards.</span>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming this month */}
      <div style={{ border: "1px solid #E8E6F0", borderRadius: 15, padding: 20, background: "#fff" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F0533", marginBottom: 4 }}>Upcoming this month</h3>
        <p style={{ fontSize: 12, color: "#9996AA" }}>
          {yearlyStats ? `${yearlyStats.birthday_count + yearlyStats.anniversary_count} celebrations this year` : "Loading..."}
        </p>
      </div>

      {/* Recently sent */}
      <div style={{ border: "1px solid #E8E6F0", borderRadius: 15, padding: 20, background: "#fff" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F0533", marginBottom: 4 }}>Recently sent</h3>
        <p style={{ fontSize: 12, color: "#9996AA", marginBottom: 12 }}>
          Celebration rewards are billed automatically when the event occurs. Manage payment → <a href="#" onClick={(e) => { e.preventDefault(); }} style={{ color: "#7F2BFE", fontWeight: 500, textDecoration: "underline" }}>Billing</a>
        </p>
        {recentLogs && recentLogs.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Employee", "Type", "Points", "Cost", "Date"].map(h => (
                  <th key={h} style={{ fontSize: 11, fontWeight: 600, color: "#9996AA", textTransform: "uppercase", letterSpacing: "0.05em", padding: "8px 12px", borderBottom: "1px solid #E8E6F0", textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentLogs.slice(0, 10).map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: 13, color: "#0F0533", padding: "10px 12px", borderBottom: "1px solid #F3F2F7" }}>{log.employee_name}</td>
                  <td style={{ fontSize: 13, color: "#6B6B80", padding: "10px 12px", borderBottom: "1px solid #F3F2F7" }}>{log.reward_type === "birthday" ? "🎂 Birthday" : "🎉 Anniversary"}</td>
                  <td style={{ fontSize: 13, color: "#6B6B80", padding: "10px 12px", borderBottom: "1px solid #F3F2F7" }}>{log.points_awarded}</td>
                  <td style={{ fontSize: 13, color: "#9996AA", padding: "10px 12px", borderBottom: "1px solid #F3F2F7" }}>${(log.points_awarded * rate).toFixed(2)}</td>
                  <td style={{ fontSize: 13, color: "#6B6B80", padding: "10px 12px", borderBottom: "1px solid #F3F2F7" }}>{format(new Date(log.created_at), "MMM d, yyyy")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ fontSize: 13, color: "#9996AA", textAlign: "center", padding: 20 }}>No celebration rewards distributed yet</p>
        )}
      </div>

      {companyId && (
        <BuyPointsDialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen} companyId={companyId} exchangeRate={rate} />
      )}
    </div>
  );
};

export default CelebrationSettingsCard;

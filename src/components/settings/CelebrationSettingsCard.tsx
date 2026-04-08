import React, { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
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
  const [upcomingOpen, setUpcomingOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);

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

  // Fetch all company profiles for upcoming celebrations
  const { data: companyProfiles } = useQuery({
    queryKey: ["company-profiles-celebrations", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from("profiles").select("id, first_name, last_name, birthday, company_start_date").eq("company_id", companyId).eq("status", "active");
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch this year's already-rewarded entries
  const { data: rewardedThisYear } = useQuery({
    queryKey: ["celebration-rewarded-this-year", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const currentYear = new Date().getFullYear();
      const { data, error } = await supabase.from("celebration_rewards_log").select("profile_id, reward_type").eq("company_id", companyId).eq("year", currentYear);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Recently sent: current + previous month
  const { data: recentLogs } = useQuery({
    queryKey: ["celebration-logs-recent", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const now = new Date();
      const firstOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const { data, error } = await supabase.from("celebration_rewards_log").select("id, reward_type, points_awarded, event_date, year, created_at, profile_id").eq("company_id", companyId).gte("created_at", firstOfPrevMonth.toISOString()).order("created_at", { ascending: false });
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

  // Compute upcoming celebrations for this month
  const upcomingCelebrations = useMemo(() => {
    if (!companyProfiles) return [];
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-indexed
    const rewardedSet = new Set(
      (rewardedThisYear || []).map((r) => `${r.profile_id}_${r.reward_type}`)
    );

    const events: { id: string; name: string; event: string; date: string; emoji: string }[] = [];

    companyProfiles.forEach((p) => {
      if (p.birthday) {
        const bd = new Date(p.birthday + "T00:00:00");
        if (bd.getMonth() === currentMonth && !rewardedSet.has(`${p.id}_birthday`)) {
          const dayInMonth = new Date(now.getFullYear(), currentMonth, bd.getDate());
          events.push({
            id: p.id + "_birthday",
            name: `${p.first_name} ${p.last_name}`.trim(),
            event: "🎂 Birthday",
            date: format(dayInMonth, "MMM d"),
            emoji: "🎂",
          });
        }
      }
      if (p.company_start_date) {
        const sd = new Date(p.company_start_date + "T00:00:00");
        if (sd.getMonth() === currentMonth && !rewardedSet.has(`${p.id}_anniversary`)) {
          const dayInMonth = new Date(now.getFullYear(), currentMonth, sd.getDate());
          events.push({
            id: p.id + "_anniversary",
            name: `${p.first_name} ${p.last_name}`.trim(),
            event: "🎉 Anniversary",
            date: format(dayInMonth, "MMM d"),
            emoji: "🎉",
          });
        }
      }
    });

    events.sort((a, b) => a.date.localeCompare(b.date));
    return events;
  }, [companyProfiles, rewardedThisYear]);

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

  const thStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 400,
    color: "#9996AA",
    lineHeight: "18px",
    padding: "8px 12px",
    textAlign: "left",
    borderBottom: "1px solid #E8E6F0",
  };

  const tdStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 400,
    color: "#0F0533",
    lineHeight: "21px",
    padding: "10px 12px",
    borderBottom: "1px solid #F3F2F7",
  };

  const dividerStyle: React.CSSProperties = {
    height: 1,
    background: "#E8E6F0",
    margin: "0 -20px",
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Single container */}
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
                <Input type="number" min="0" step="0.01" value={birthdayDollars} onChange={(e) => setBirthdayDollars(e.target.value)} style={inputStyle} />
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
                <Input type="number" min="0" step="0.01" value={anniversaryDollars} onChange={(e) => setAnniversaryDollars(e.target.value)} style={inputStyle} />
              </div>
            </div>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={() => saveMutation.mutate()}
          disabled={!hasChanges || saveMutation.isPending}
          style={{
            fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500, height: 38,
            paddingLeft: 24, paddingRight: 24, borderRadius: 13.375, border: "none",
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
                fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 500, height: 32,
                paddingLeft: 16, paddingRight: 16, borderRadius: 9.375,
                border: "1px solid #E8E6F0", background: "#fff", color: "#0F0533", cursor: "pointer",
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

        {/* Divider */}
        <div style={{ ...dividerStyle, marginTop: 24, marginBottom: 0 }} />

        {/* Upcoming this month - collapsible */}
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setUpcomingOpen(!upcomingOpen)}
          style={{ padding: "16px 0" }}
        >
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F0533", marginBottom: 2 }}>Upcoming this month</h3>
            <p style={{ fontSize: 12, color: "#9996AA" }}>{upcomingCelebrations.length} celebration{upcomingCelebrations.length !== 1 ? "s" : ""} this month</p>
          </div>
          {upcomingOpen ? <ChevronUp size={18} color="#9996AA" /> : <ChevronDown size={18} color="#9996AA" />}
        </div>

        {upcomingOpen && (
          <div style={{ marginBottom: 16 }}>
            {upcomingCelebrations.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Employee</th>
                    <th style={thStyle}>Event</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Charge</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingCelebrations.map((c) => (
                    <tr key={c.id}>
                      <td style={tdStyle}>{c.name}</td>
                      <td style={tdStyle}>{c.event}</td>
                      <td style={tdStyle}>{c.date}</td>
                      <td style={{ ...tdStyle, color: "#9996AA" }}>$0.00</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ fontSize: 13, color: "#9996AA", textAlign: "center", padding: "12px 0" }}>No upcoming celebrations this month</p>
            )}
          </div>
        )}

        {/* Divider */}
        <div style={dividerStyle} />

        {/* Recently sent - collapsible */}
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setRecentOpen(!recentOpen)}
          style={{ padding: "16px 0" }}
        >
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F0533", marginBottom: 2 }}>Recently sent</h3>
            <p style={{ fontSize: 12, color: "#9996AA" }}>{recentLogs?.length || 0} reward{(recentLogs?.length || 0) !== 1 ? "s" : ""} sent recently</p>
          </div>
          {recentOpen ? <ChevronUp size={18} color="#9996AA" /> : <ChevronDown size={18} color="#9996AA" />}
        </div>

        {recentOpen && (
          <div style={{ marginBottom: 16 }}>
            {recentLogs && recentLogs.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Employee</th>
                    <th style={thStyle}>Event</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Amount sent</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={tdStyle}>{log.employee_name}</td>
                      <td style={tdStyle}>{log.reward_type === "birthday" ? "🎂 Birthday" : "🎉 Anniversary"}</td>
                      <td style={tdStyle}>{format(new Date(log.created_at), "MMM d, yyyy")}</td>
                      <td style={tdStyle}>${(log.points_awarded * rate).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ fontSize: 13, color: "#9996AA", textAlign: "center", padding: "12px 0" }}>No celebration rewards distributed yet</p>
            )}
          </div>
        )}

        {/* Billing footnote */}
        <div style={{ ...dividerStyle, marginBottom: 16 }} />
        <p style={{ fontSize: 12, color: "#9996AA" }}>
          Celebration rewards are billed automatically when the event occurs. Manage payment → <a href="#" onClick={(e) => { e.preventDefault(); }} style={{ color: "#7F2BFE", fontWeight: 500, textDecoration: "underline" }}>Billing</a>
        </p>
      </div>

      {companyId && (
        <BuyPointsDialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen} companyId={companyId} exchangeRate={rate} />
      )}
    </div>
  );
};

export default CelebrationSettingsCard;

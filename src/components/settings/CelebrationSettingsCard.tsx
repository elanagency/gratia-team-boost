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

const CelebrationSettingsCard = () => {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const { pointExchangeRate } = usePlatformSettings();
  const [upcomingOpen, setUpcomingOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);

  const rate = pointExchangeRate || 0.05;

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["company-celebration-settings", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("birthday_rewards_enabled, birthday_reward_points, anniversary_rewards_enabled, anniversary_reward_points, stripe_subscription_id, stripe_customer_id_test, stripe_customer_id_live, environment")
        .eq("id", companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch all company profiles for upcoming celebrations
  const { data: companyProfiles } = useQuery({
    queryKey: ["company-profiles-celebrations", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, birthday, company_start_date")
        .eq("company_id", companyId)
        .eq("status", "active");
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
      const { data, error } = await supabase
        .from("celebration_rewards_log")
        .select("profile_id, reward_type")
        .eq("company_id", companyId)
        .eq("year", currentYear);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Recently sent: current + previous month, includes billing fields
  const { data: recentLogs } = useQuery({
    queryKey: ["celebration-logs-recent", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const now = new Date();
      const firstOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const { data, error } = await supabase
        .from("celebration_rewards_log")
        .select("id, reward_type, points_awarded, event_date, year, created_at, profile_id, dollar_amount, billing_status")
        .eq("company_id", companyId)
        .gte("created_at", firstOfPrevMonth.toISOString())
        .order("created_at", { ascending: false });
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

  // Pending celebration charges (this billing cycle)
  const { data: pendingCharges } = useQuery({
    queryKey: ["celebration-pending-charges", companyId],
    queryFn: async () => {
      if (!companyId) return { count: 0, total: 0 };
      const { data, error } = await supabase
        .from("celebration_rewards_log")
        .select("dollar_amount")
        .eq("company_id", companyId)
        .eq("billing_status", "pending");
      if (error) throw error;
      const total = (data || []).reduce((sum, r: any) => sum + (Number(r.dollar_amount) || 0), 0);
      return { count: data?.length || 0, total };
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
  const birthdayDollarValue = (parseFloat(birthdayDollars) || 0);
  const anniversaryDollarValue = (parseFloat(anniversaryDollars) || 0);

  // Compute upcoming celebrations for this month with projected dollar charge
  const upcomingCelebrations = useMemo(() => {
    if (!companyProfiles) return [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const rewardedSet = new Set(
      (rewardedThisYear || []).map((r) => `${r.profile_id}_${r.reward_type}`)
    );

    const events: { id: string; name: string; event: string; date: string; charge: number; enabled: boolean }[] = [];

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
            charge: birthdayDollarValue,
            enabled: birthdayEnabled,
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
            charge: anniversaryDollarValue,
            enabled: anniversaryEnabled,
          });
        }
      }
    });

    events.sort((a, b) => a.date.localeCompare(b.date));
    return events;
  }, [companyProfiles, rewardedThisYear, birthdayDollarValue, anniversaryDollarValue, birthdayEnabled, anniversaryEnabled]);

  const upcomingProjectedTotal = upcomingCelebrations.reduce(
    (sum, e) => sum + (e.enabled ? e.charge : 0),
    0,
  );

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

  const hasChanges =
    company &&
    (birthdayEnabled !== company.birthday_rewards_enabled ||
      birthdayPointsCalc !== company.birthday_reward_points ||
      anniversaryEnabled !== company.anniversary_rewards_enabled ||
      anniversaryPointsCalc !== company.anniversary_reward_points);

  // Has active billing setup?
  const env = (company?.environment || "test").toLowerCase();
  const hasStripeCustomer = env === "live" ? !!company?.stripe_customer_id_live : !!company?.stripe_customer_id_test;
  const hasActiveBilling = hasStripeCustomer && !!company?.stripe_subscription_id;

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

        {/* Billing accrual summary (replaces wallet) */}
        <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: 13.375, background: "#F8F5FF", border: "1px solid #E8E6F0" }}>
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#0F0533" }}>Accrued this billing cycle</p>
              <p style={{ fontSize: 12, color: "#9996AA" }}>
                ${(pendingCharges?.total || 0).toFixed(2)} · {pendingCharges?.count || 0} celebration{(pendingCharges?.count || 0) !== 1 ? "s" : ""}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 11, color: "#9996AA", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Bills with</p>
              <p style={{ fontSize: 12, fontWeight: 500, color: "#7F2BFE" }}>your next invoice</p>
            </div>
          </div>
          {!hasActiveBilling && (birthdayEnabled || anniversaryEnabled) && (
            <div className="flex items-start gap-2 mt-3" style={{ fontSize: 12, color: "#E53E3E" }}>
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>No active billing subscription. Celebrations will still send points but charges will be marked failed until billing is activated.</span>
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
            <p style={{ fontSize: 12, color: "#9996AA" }}>
              {upcomingCelebrations.length} celebration{upcomingCelebrations.length !== 1 ? "s" : ""} · projected ${upcomingProjectedTotal.toFixed(2)}
            </p>
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
                    <th style={thStyle}>Projected charge</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingCelebrations.map((c) => (
                    <tr key={c.id}>
                      <td style={tdStyle}>{c.name}</td>
                      <td style={tdStyle}>{c.event}</td>
                      <td style={tdStyle}>{c.date}</td>
                      <td style={{ ...tdStyle, color: c.enabled ? "#0F0533" : "#9996AA" }}>
                        {c.enabled ? `$${c.charge.toFixed(2)}` : "Disabled"}
                      </td>
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
                    <th style={thStyle}>Charged</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log: any) => {
                    const charged = log.dollar_amount != null
                      ? Number(log.dollar_amount)
                      : log.points_awarded * rate;
                    const status = log.billing_status || "pending";
                    const statusColors: Record<string, { bg: string; fg: string; label: string }> = {
                      pending: { bg: "#FEF3C7", fg: "#92400E", label: "Pending" },
                      invoiced: { bg: "#DCFCE7", fg: "#15803D", label: "Billed" },
                      failed: { bg: "#FEE2E2", fg: "#B91C1C", label: "Failed" },
                    };
                    const sc = statusColors[status] || statusColors.pending;
                    return (
                      <tr key={log.id}>
                        <td style={tdStyle}>{log.employee_name}</td>
                        <td style={tdStyle}>{log.reward_type === "birthday" ? "🎂 Birthday" : "🎉 Anniversary"}</td>
                        <td style={tdStyle}>{format(new Date(log.created_at), "MMM d, yyyy")}</td>
                        <td style={tdStyle}>${charged.toFixed(2)}</td>
                        <td style={tdStyle}>
                          <span style={{
                            display: "inline-block",
                            padding: "2px 10px",
                            borderRadius: 999,
                            background: sc.bg,
                            color: sc.fg,
                            fontSize: 11,
                            fontWeight: 600,
                          }}>{sc.label}</span>
                        </td>
                      </tr>
                    );
                  })}
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
          Celebration rewards are billed on your next monthly invoice — no prepayment required.
        </p>
      </div>
    </div>
  );
};

export default CelebrationSettingsCard;

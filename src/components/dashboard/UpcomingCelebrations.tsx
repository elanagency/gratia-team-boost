import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, setYear, differenceInDays, isAfter } from "date-fns";

type Celebration = {
  name: string;
  date: Date;
  type: "birthday" | "anniversary";
  daysUntil: number;
};

export function UpcomingCelebrations() {
  const { companyId } = useAuth();

  const { data: celebrations = [], isLoading } = useQuery({
    queryKey: ["upcoming-celebrations", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("first_name, last_name, birthday, company_start_date")
        .eq("company_id", companyId)
        .eq("status", "active");

      if (!profiles) return [];

      const today = new Date();
      const year = today.getFullYear();
      const results: Celebration[] = [];

      for (const p of profiles) {
        const name = `${p.first_name} ${p.last_name}`;

        if (p.birthday) {
          let nextBday = setYear(parseISO(p.birthday), year);
          if (!isAfter(nextBday, today) && differenceInDays(nextBday, today) !== 0) {
            nextBday = setYear(nextBday, year + 1);
          }
          const diff = differenceInDays(nextBday, today);
          if (diff >= 0 && diff <= 30) {
            results.push({ name, date: nextBday, type: "birthday", daysUntil: diff });
          }
        }

        if (p.company_start_date) {
          let nextAnniv = setYear(parseISO(p.company_start_date), year);
          if (!isAfter(nextAnniv, today) && differenceInDays(nextAnniv, today) !== 0) {
            nextAnniv = setYear(nextAnniv, year + 1);
          }
          const diff = differenceInDays(nextAnniv, today);
          if (diff >= 0 && diff <= 30) {
            results.push({ name, date: nextAnniv, type: "anniversary", daysUntil: diff });
          }
        }
      }

      return results.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 3);
    },
    enabled: !!companyId,
  });

  return (
    <div className="rounded-[13.375px] border border-[#E8E6F0] bg-white overflow-hidden">
      <div
        className="flex items-center"
        style={{
          height: "44.5px",
          padding: "0 15px",
          borderBottom: "1px solid #E8E6F0",
        }}
      >
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: "#0F0533",
            lineHeight: "21px",
          }}
        >
          Upcoming Celebrations
        </span>
      </div>

      <div style={{ padding: "11.25px 15px 11.25px 15px" }}>
        {isLoading ? (
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#9996AA" }}>
            Loading...
          </p>
        ) : celebrations.length === 0 ? (
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#9996AA" }}>
            No celebrations in the next 30 days
          </p>
        ) : (
          <div className="flex flex-col" style={{ gap: "11.25px" }}>
            {celebrations.map((c, i) => (
              <div
                key={i}
                className="flex items-center"
                style={{
                  gap: "11.25px",
                  paddingBottom: i < celebrations.length - 1 ? "11.25px" : "0",
                  borderBottom: i < celebrations.length - 1 ? "1px solid #E8E6F0" : "none",
                }}
              >
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: "37px", height: "37px", fontSize: "20px" }}
                >
                  {c.type === "birthday" ? "🎂" : "🎉"}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="truncate"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#0F0533",
                      lineHeight: "19.5px",
                      margin: 0,
                    }}
                  >
                    {c.name}
                  </p>
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "11px",
                      fontWeight: 400,
                      color: "#9996AA",
                      lineHeight: "16.5px",
                      margin: 0,
                    }}
                  >
                    {c.type === "birthday" ? "Birthday" : "Work Anniversary"}
                  </p>
                </div>
                <span
                  className="flex-shrink-0"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    fontWeight: 400,
                    color: "#9996AA",
                    lineHeight: "18px",
                  }}
                >
                  {format(c.date, "MMM d")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

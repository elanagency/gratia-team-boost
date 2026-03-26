import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Cake, Briefcase } from "lucide-react";
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

      return results.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 5);
    },
    enabled: !!companyId,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Upcoming Celebrations</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : celebrations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No celebrations in the next 30 days
          </p>
        ) : (
          <div className="space-y-3">
            {celebrations.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    c.type === "birthday"
                      ? "bg-pink-100 text-pink-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {c.type === "birthday" ? (
                    <Cake className="h-4 w-4" />
                  ) : (
                    <Briefcase className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.type === "birthday" ? "Birthday" : "Work Anniversary"} ·{" "}
                    {c.daysUntil === 0
                      ? "Today!"
                      : c.daysUntil === 1
                      ? "Tomorrow"
                      : `In ${c.daysUntil} days`}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {format(c.date, "MMM d")}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Users, Gift, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { MetricType } from "@/hooks/useAnalyticsData";

interface MetricItem {
  id: MetricType;
  label: string;
  icon: React.ReactNode;
  parent?: string;
}

interface MetricGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: MetricItem[];
}

const metricGroups: MetricGroup[] = [
  {
    id: "recognition",
    label: "Recognition",
    icon: <TrendingUp className="h-4 w-4" />,
    items: [
      { id: "received", label: "Received", icon: <TrendingDown className="h-3.5 w-3.5" />, parent: "recognition" },
      { id: "sent", label: "Sent", icon: <TrendingUp className="h-3.5 w-3.5" />, parent: "recognition" },
    ],
  },
  {
    id: "engagement",
    label: "Engagement",
    icon: <Users className="h-4 w-4" />,
    items: [
      { id: "engagement", label: "Rate", icon: <Users className="h-3.5 w-3.5" />, parent: "engagement" },
    ],
  },
  {
    id: "redemptions",
    label: "Redemptions",
    icon: <Gift className="h-4 w-4" />,
    items: [
      { id: "redemptions", label: "Points", icon: <Gift className="h-3.5 w-3.5" />, parent: "redemptions" },
    ],
  },
];

interface AnalyticsMetricsSidebarProps {
  selectedMetric: MetricType;
  onMetricChange: (metric: MetricType) => void;
}

export function AnalyticsMetricsSidebar({
  selectedMetric,
  onMetricChange,
}: AnalyticsMetricsSidebarProps) {
  const [openGroups, setOpenGroups] = React.useState<string[]>(["recognition", "engagement", "redemptions"]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const isGroupSelected = (group: MetricGroup) => {
    return group.items.some((item) => item.id === selectedMetric);
  };

  return (
    <div className="w-56 border-r border-border bg-card h-full">
      <div className="p-4 border-b border-border">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
          Metrics
        </h3>
      </div>
      <nav className="p-2">
        {metricGroups.map((group) => (
          <Collapsible
            key={group.id}
            open={openGroups.includes(group.id)}
            onOpenChange={() => toggleGroup(group.id)}
          >
            <CollapsibleTrigger
              className={cn(
                "flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium transition-colors",
                "hover:bg-muted/50",
                isGroupSelected(group) && "text-primary"
              )}
            >
              <div className="flex items-center gap-2">
                {group.icon}
                <span>{group.label}</span>
              </div>
              {openGroups.includes(group.id) ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-4 mt-1 space-y-0.5">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onMetricChange(item.id)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-sm transition-colors",
                      "hover:bg-muted/50",
                      selectedMetric === item.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </nav>
    </div>
  );
}

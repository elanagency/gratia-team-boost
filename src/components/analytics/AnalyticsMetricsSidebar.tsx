import React from "react";
import { cn } from "@/lib/utils";
import { Users, Gift, Coins, Send, LogIn } from "lucide-react";
import type { MetricType } from "@/hooks/useAnalyticsData";

interface MetricItem {
  id: MetricType;
  label: string;
  icon: React.ReactNode;
}

const metrics: MetricItem[] = [
  { id: "received", label: "Recognition Received", icon: <Coins className="h-4 w-4" /> },
  { id: "sent", label: "Recognition Sent", icon: <Send className="h-4 w-4" /> },
  { id: "engagement", label: "Engagement Rate", icon: <Users className="h-4 w-4" /> },
  { id: "redemptions", label: "Redemptions", icon: <Gift className="h-4 w-4" /> },
  { id: "logins", label: "User Activity", icon: <LogIn className="h-4 w-4" /> },
];

interface AnalyticsMetricsSidebarProps {
  selectedMetric: MetricType;
  onMetricChange: (metric: MetricType) => void;
}

export function AnalyticsMetricsSidebar({
  selectedMetric,
  onMetricChange,
}: AnalyticsMetricsSidebarProps) {
  return (
    <div className="w-56 border-r border-border bg-card h-full">
      <div className="p-4 border-b border-border">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
          Metrics
        </h3>
      </div>
      <nav className="p-2 space-y-1">
        {metrics.map((metric) => (
          <button
            key={metric.id}
            onClick={() => onMetricChange(metric.id)}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors",
              "hover:bg-muted/50",
              selectedMetric === metric.id
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground"
            )}
          >
            {metric.icon}
            <span>{metric.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

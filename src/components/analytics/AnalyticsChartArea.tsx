import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChartDataPoint, MetricType } from "@/hooks/useAnalyticsData";

interface AnalyticsChartAreaProps {
  data: ChartDataPoint[];
  isLoading: boolean;
  metric: MetricType;
  total: number;
  average: number;
}

const metricLabels: Record<MetricType, string> = {
  received: "Recognition Received",
  sent: "Recognition Sent",
  engagement: "Engagement Rate",
  redemptions: "Points Redeemed",
};

const metricUnits: Record<MetricType, string> = {
  received: "points",
  sent: "points",
  engagement: "%",
  redemptions: "points",
};

export function AnalyticsChartArea({
  data,
  isLoading,
  metric,
  total,
  average,
}: AnalyticsChartAreaProps) {
  if (isLoading) {
    return (
      <Card className="flex-1">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const unit = metricUnits[metric];

  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">
            {metricLabels[metric]}
          </CardTitle>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Total: </span>
              <span className="font-semibold">
                {total.toLocaleString()}{unit === "%" ? "%" : ` ${unit}`}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Avg: </span>
              <span className="font-semibold">
                {average.toLocaleString()}{unit === "%" ? "%" : ` ${unit}`}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No data available for the selected period
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(302, 100%, 72%)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(302, 100%, 72%)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  width={50}
                  tickFormatter={(value) =>
                    metric === "engagement" ? `${value}%` : value.toLocaleString()
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                  formatter={(value: number) => [
                    `${value.toLocaleString()}${unit === "%" ? "%" : ` ${unit}`}`,
                    metricLabels[metric],
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(302, 100%, 72%)"
                  strokeWidth={2}
                  fill="url(#colorValue)"
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: "hsl(302, 100%, 72%)",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

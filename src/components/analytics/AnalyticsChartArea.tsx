import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ChartDataPoint, MetricType, SegmentType } from "@/hooks/useAnalyticsData";

interface AnalyticsChartAreaProps {
  data: ChartDataPoint[];
  isLoading: boolean;
  metric: MetricType;
  total: number;
  average: number;
  trend: number;
  segmentBy: SegmentType;
}

const metricLabels: Record<MetricType, string> = {
  received: "Recognition Received",
  sent: "Recognition Sent",
  engagement: "Engagement Rate",
  redemptions: "Points Redeemed",
  logins: "Daily Active Users",
};

const metricUnits: Record<MetricType, string> = {
  received: "points",
  sent: "points",
  engagement: "%",
  redemptions: "points",
  logins: "users",
};

// Color palette for segments
const SEGMENT_COLORS = [
  "#F572FF", // Primary accent (pink)
  "#6366F1", // Indigo
  "#22C55E", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#06B6D4", // Cyan
  "#8B5CF6", // Purple
  "#EC4899", // Pink variant
];

export function AnalyticsChartArea({
  data,
  isLoading,
  metric,
  total,
  average,
  trend,
  segmentBy,
}: AnalyticsChartAreaProps) {
  // Extract unique segment keys from data
  const segmentKeys = useMemo(() => {
    if (segmentBy === 'none') return [];
    
    const keys = new Set<string>();
    data.forEach(d => {
      if (d.segments) {
        Object.keys(d.segments).forEach(k => keys.add(k));
      }
    });
    // Limit to top 8 segments
    return Array.from(keys).slice(0, 8);
  }, [data, segmentBy]);

  // Transform data for multi-series chart
  const chartData = useMemo(() => {
    if (segmentBy === 'none' || segmentKeys.length === 0) {
      return data;
    }

    return data.map(d => {
      const point: Record<string, any> = { date: d.date, value: d.value };
      segmentKeys.forEach(key => {
        point[key] = d.segments?.[key] || 0;
      });
      return point;
    });
  }, [data, segmentBy, segmentKeys]);

  const isSegmented = segmentBy !== 'none' && segmentKeys.length > 0;

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

  // Trend display
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? "text-green-600" : trend < 0 ? "text-red-500" : "text-muted-foreground";
  const trendLabel = trend === 0 ? "—" : `${trend > 0 ? "+" : ""}${trend}%`;

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
            <div className={`flex items-center gap-1 ${trendColor}`}>
              <TrendIcon className="h-4 w-4" />
              <span className="font-semibold">{trendLabel}</span>
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
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  {/* Default gradient for non-segmented view */}
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
                  {/* Gradients for each segment */}
                  {segmentKeys.map((key, index) => (
                    <linearGradient
                      key={`gradient-${key}`}
                      id={`gradient-${index}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={SEGMENT_COLORS[index % SEGMENT_COLORS.length]}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={SEGMENT_COLORS[index % SEGMENT_COLORS.length]}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  ))}
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
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString()}${unit === "%" ? "%" : ` ${unit}`}`,
                    isSegmented ? name : metricLabels[metric],
                  ]}
                />
                {isSegmented ? (
                  <>
                    {segmentKeys.map((key, index) => (
                      <Area
                        key={key}
                        type="monotone"
                        dataKey={key}
                        name={key}
                        stroke={SEGMENT_COLORS[index % SEGMENT_COLORS.length]}
                        strokeWidth={2}
                        fill={`url(#gradient-${index})`}
                        dot={false}
                        activeDot={{
                          r: 5,
                          fill: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                      />
                    ))}
                    <Legend
                      verticalAlign="top"
                      height={36}
                      iconType="circle"
                      formatter={(value) => (
                        <span className="text-xs text-muted-foreground">{value}</span>
                      )}
                    />
                  </>
                ) : (
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
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

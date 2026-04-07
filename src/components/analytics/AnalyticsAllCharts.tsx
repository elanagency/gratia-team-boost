import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChartDataPoint } from "@/hooks/useAnalyticsData";

interface AnalyticsAllChartsProps {
  sentData: ChartDataPoint[];
  receivedData: ChartDataPoint[];
  engagementData: ChartDataPoint[];
  redemptionsData: ChartDataPoint[];
  isLoading: boolean;
}

const CHART_PURPLE = "#7F2BFE";
const CHART_PINK = "#FC5BFF";
const GRID_COLOR = "#E8E6F0";
const LABEL_COLOR = "#9996AA";
const TITLE_COLOR = "#0F0533";

const cardStyle = "rounded-[15px] border bg-white";
const cardBorderStyle = { borderColor: GRID_COLOR };

const axisTickStyle = { fontSize: 12, fontWeight: 400, fill: LABEL_COLOR };

function ChartCard({ title, children, isLoading }: { title: string; children: React.ReactNode; isLoading: boolean }) {
  return (
    <div className={cardStyle} style={{ ...cardBorderStyle, padding: "19.75px" }}>
      <h3 className="mb-4" style={{ fontSize: 15, fontWeight: 600, color: TITLE_COLOR }}>{title}</h3>
      <div className="h-64">
        {isLoading ? (
          <Skeleton className="h-full w-full rounded-lg" />
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// Merge sent and received data by date for grouped bar chart
function mergeRecognitionData(sent: ChartDataPoint[], received: ChartDataPoint[]) {
  const map = new Map<string, { date: string; sent: number; received: number }>();
  sent.forEach(d => map.set(d.date, { date: d.date, sent: d.value, received: 0 }));
  received.forEach(d => {
    const existing = map.get(d.date);
    if (existing) {
      existing.received = d.value;
    } else {
      map.set(d.date, { date: d.date, sent: 0, received: d.value });
    }
  });
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function AnalyticsAllCharts({
  sentData,
  receivedData,
  engagementData,
  redemptionsData,
  isLoading,
}: AnalyticsAllChartsProps) {
  const recognitionData = mergeRecognitionData(sentData, receivedData);

  return (
    <div className="space-y-6">
      {/* Recognition Trend */}
      <ChartCard title="Recognition Trend" isLoading={isLoading}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={recognitionData} barGap={2} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="4 4" stroke={GRID_COLOR} vertical={false} />
            <XAxis dataKey="date" tick={axisTickStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} />
            <Tooltip />
            <Legend
              verticalAlign="bottom"
              iconType="square"
              iconSize={10}
              wrapperStyle={{ fontSize: 12, fontWeight: 400, paddingTop: 12 }}
            />
            <Bar dataKey="sent" name="Sent" fill={CHART_PURPLE} radius={[3, 3, 0, 0]} />
            <Bar dataKey="received" name="Received" fill={CHART_PINK} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Participation Rate */}
      <ChartCard title="Participation Rate" isLoading={isLoading}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={engagementData}>
            <CartesianGrid strokeDasharray="4 4" stroke={GRID_COLOR} vertical={false} />
            <XAxis dataKey="date" tick={axisTickStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} unit="%" />
            <Tooltip formatter={(value: number) => `${value}%`} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={CHART_PURPLE}
              strokeWidth={2}
              dot={false}
              name="Participation Rate"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Redemptions */}
      <ChartCard title="Redemptions" isLoading={isLoading}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={redemptionsData}>
            <CartesianGrid strokeDasharray="4 4" stroke={GRID_COLOR} vertical={false} />
            <XAxis dataKey="date" tick={axisTickStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="value" name="Redemptions" fill={CHART_PURPLE} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

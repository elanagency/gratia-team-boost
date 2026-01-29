import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TableDataRow, MetricType, SegmentType } from "@/hooks/useAnalyticsData";

interface AnalyticsDataTableProps {
  data: TableDataRow[];
  isLoading: boolean;
  metric: MetricType;
  average: number;
  segmentBy: SegmentType;
}

const metricUnits: Record<MetricType, string> = {
  received: "pts",
  sent: "pts",
  engagement: "%",
  redemptions: "pts",
  logins: "logins",
};

export function AnalyticsDataTable({
  data,
  isLoading,
  metric,
  average,
  segmentBy,
}: AnalyticsDataTableProps) {
  const unit = metricUnits[metric];
  const isSegmented = segmentBy !== 'none';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return null;
  }

  // Calculate segment-specific averages if segmented
  const segmentAverages: Record<string, number> = {};
  if (isSegmented) {
    const segmentTotals: Record<string, { sum: number; count: number }> = {};
    data.forEach(row => {
      const key = row.segmentName || 'Total';
      if (!segmentTotals[key]) {
        segmentTotals[key] = { sum: 0, count: 0 };
      }
      segmentTotals[key].sum += row.value;
      segmentTotals[key].count += 1;
    });
    Object.entries(segmentTotals).forEach(([key, { sum, count }]) => {
      segmentAverages[key] = count > 0 ? Math.round(sum / count) : 0;
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {isSegmented ? "Breakdown by " + (segmentBy === 'department' ? "Department" : "Person") : "Daily Breakdown"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-md border max-h-[300px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Date</TableHead>
                {isSegmented && (
                  <TableHead className="font-semibold">
                    {segmentBy === 'department' ? 'Department' : 'Person'}
                  </TableHead>
                )}
                <TableHead className="text-right font-semibold">Value</TableHead>
                <TableHead className="text-right font-semibold">vs Avg</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => {
                const compareAvg = isSegmented && row.segmentName 
                  ? segmentAverages[row.segmentName] || average
                  : average;
                const diff = row.value - compareAvg;
                const diffPercent = compareAvg > 0 ? Math.round((diff / compareAvg) * 100) : 0;
                const isPositive = diff > 0;
                const isNeutral = diff === 0;

                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.date}</TableCell>
                    {isSegmented && (
                      <TableCell className="text-muted-foreground">
                        {row.segmentName || '—'}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      {row.value.toLocaleString()}{unit === "%" ? "%" : ` ${unit}`}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          isNeutral
                            ? "text-muted-foreground"
                            : isPositive
                            ? "text-green-600"
                            : "text-red-500"
                        }
                      >
                        {isNeutral ? "—" : `${isPositive ? "+" : ""}${diffPercent}%`}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

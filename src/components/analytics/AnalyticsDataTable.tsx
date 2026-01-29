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
import type { TableDataRow, MetricType } from "@/hooks/useAnalyticsData";

interface AnalyticsDataTableProps {
  data: TableDataRow[];
  isLoading: boolean;
  metric: MetricType;
  average: number;
}

const metricUnits: Record<MetricType, string> = {
  received: "pts",
  sent: "pts",
  engagement: "%",
  redemptions: "pts",
};

export function AnalyticsDataTable({
  data,
  isLoading,
  metric,
  average,
}: AnalyticsDataTableProps) {
  const unit = metricUnits[metric];

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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Daily Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-md border max-h-[300px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="text-right font-semibold">Value</TableHead>
                <TableHead className="text-right font-semibold">vs Avg</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => {
                const diff = row.value - average;
                const diffPercent = average > 0 ? Math.round((diff / average) * 100) : 0;
                const isPositive = diff > 0;
                const isNeutral = diff === 0;

                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.date}</TableCell>
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

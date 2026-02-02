import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Papa from "papaparse";
import type { TableDataRow, MetricType, SegmentType } from "@/hooks/useAnalyticsData";

interface AnalyticsDataTableProps {
  data: TableDataRow[];
  isLoading: boolean;
  metric: MetricType;
  segmentBy: SegmentType;
}

const metricUnits: Record<MetricType, string> = {
  received: " pts",
  sent: " pts",
  engagement: "%",
  redemptions: " pts",
  logins: "",
};

interface PivotedRow {
  label: string;
  values: Record<string, number>;
}

function pivotTableData(data: TableDataRow[], segmentBy: SegmentType): { dates: string[]; rows: PivotedRow[] } {
  // Get unique dates in order
  const dates = [...new Set(data.map(row => row.date))];
  
  if (segmentBy === 'none') {
    // Single "Total" row with values for each date
    const values: Record<string, number> = {};
    data.forEach(row => {
      values[row.date] = row.value;
    });
    return {
      dates,
      rows: [{ label: 'Total', values }]
    };
  }
  
  // Group by segment
  const segmentMap: Record<string, Record<string, number>> = {};
  const totals: Record<string, number> = {};
  
  data.forEach(row => {
    const segment = row.segmentName || 'Unknown';
    if (!segmentMap[segment]) segmentMap[segment] = {};
    segmentMap[segment][row.date] = row.value;
    totals[row.date] = (totals[row.date] || 0) + row.value;
  });
  
  // Build rows: Total first, then segments alphabetically (excluding any "Total" segment from data)
  const sortedSegments = Object.keys(segmentMap)
    .filter(label => label !== 'Total')
    .sort();
  const rows: PivotedRow[] = [
    { label: 'Total', values: totals },
    ...sortedSegments.map(label => ({ label, values: segmentMap[label] }))
  ];
  
  return { dates, rows };
}

export function AnalyticsDataTable({
  data,
  isLoading,
  metric,
  segmentBy,
}: AnalyticsDataTableProps) {
  const unit = metricUnits[metric];

  const { dates, rows } = useMemo(() => pivotTableData(data, segmentBy), [data, segmentBy]);

  const handleExportCSV = () => {
    const headerRow = [segmentBy !== 'none' ? 'Segments' : 'Metric', ...dates];
    
    const dataRows = rows.map(row => [
      row.label,
      ...dates.map(date => row.values[date] || 0)
    ]);
    
    const csvData = [headerRow, ...dataRows];
    const csv = Papa.unparse(csvData);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${metric}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
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
      <CardContent className="pt-4">
        <div className="flex justify-end mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full caption-bottom text-sm min-w-max">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground sticky left-0 z-10 bg-muted/50 min-w-[140px] border-r border-border/50">
                  {segmentBy !== 'none' ? 'Segments' : 'Metric'}
                </th>
                {dates.map(date => (
                  <th key={date} className="h-12 px-4 text-right align-middle font-semibold text-muted-foreground min-w-[90px]">
                    {date}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {rows.map((row) => (
                <tr key={row.label} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle font-medium sticky left-0 z-10 bg-background border-r border-border/50">
                    {row.label}
                  </td>
                  {dates.map(date => (
                    <td key={date} className="p-4 align-middle text-right">
                      {(row.values[date] || 0).toLocaleString()}{unit}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

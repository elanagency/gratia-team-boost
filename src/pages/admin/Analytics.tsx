import React, { useState, useEffect } from "react";
import { subDays } from "date-fns";
import { AnalyticsMetricsSidebar } from "@/components/analytics/AnalyticsMetricsSidebar";
import { AnalyticsChartArea } from "@/components/analytics/AnalyticsChartArea";
import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters";
import { AnalyticsDataTable } from "@/components/analytics/AnalyticsDataTable";
import {
  useAnalyticsData,
  type MetricType,
  type SegmentType,
  type GranularityType,
  type DateRange,
} from "@/hooks/useAnalyticsData";

const Analytics = () => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("received");
  const [dateRange, setDateRange] = useState<DateRange>({
    start: subDays(new Date(), 30),
    end: new Date(),
  });
  const [segmentBy, setSegmentBy] = useState<SegmentType>("none");
  const [granularity, setGranularity] = useState<GranularityType>("daily");

  const isSegmentDisabled = selectedMetric === "engagement";

  useEffect(() => {
    if (isSegmentDisabled) {
      setSegmentBy("none");
    }
  }, [isSegmentDisabled]);

  const { data, isLoading, error } = useAnalyticsData({
    metric: selectedMetric,
    dateRange,
    segmentBy,
    granularity,
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Left Sidebar */}
      <AnalyticsMetricsSidebar
        selectedMetric={selectedMetric}
        onMetricChange={setSelectedMetric}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Page Header with Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
            <AnalyticsFilters
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              segmentBy={segmentBy}
              onSegmentChange={setSegmentBy}
              granularity={granularity}
              onGranularityChange={setGranularity}
              disableSegment={isSegmentDisabled}
            />
          </div>

          {/* Error State */}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
              Failed to load analytics data. Please try again.
            </div>
          )}

          {/* Chart Area */}
          <AnalyticsChartArea
            data={data?.chartData || []}
            isLoading={isLoading}
            metric={selectedMetric}
            total={data?.total || 0}
            average={data?.average || 0}
            trend={data?.trend || 0}
            segmentBy={segmentBy}
          />

          {/* Data Table */}
          <AnalyticsDataTable
            data={data?.tableData || []}
            isLoading={isLoading}
            metric={selectedMetric}
            segmentBy={segmentBy}
          />
        </div>
      </div>
    </div>
  );
};

export default Analytics;

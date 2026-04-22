import React, { useState } from "react";
import { subDays } from "date-fns";
import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters";
import { AnalyticsAllCharts } from "@/components/analytics/AnalyticsAllCharts";
import {
  useAnalyticsData,
  type GranularityType,
  type DateRange,
} from "@/hooks/useAnalyticsData";

const Analytics = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    start: subDays(new Date(), 30),
    end: new Date(),
  });
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [granularity, setGranularity] = useState<GranularityType>("monthly");

  const sentQuery = useAnalyticsData({ metric: "sent", dateRange, segmentBy: "none", granularity, departmentFilter });
  const receivedQuery = useAnalyticsData({ metric: "received", dateRange, segmentBy: "none", granularity, departmentFilter });
  const engagementQuery = useAnalyticsData({ metric: "engagement", dateRange, segmentBy: "none", granularity, departmentFilter });
  const redemptionsQuery = useAnalyticsData({ metric: "redemptions", dateRange, segmentBy: "none", granularity, departmentFilter });

  const isLoading = sentQuery.isLoading || receivedQuery.isLoading || engagementQuery.isLoading || redemptionsQuery.isLoading;
  const hasError = sentQuery.error || receivedQuery.error || engagementQuery.error || redemptionsQuery.error;

  return (
    <div className="-mx-4 -mt-16 -mb-4 lg:-mx-[60px] lg:-mt-[72px] lg:-mb-4 min-h-screen" style={{ padding: "22.5px 135.5px" }}>
      <div className="space-y-6">
        {/* Page Header with Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#0F0533', fontFamily: 'Inter, sans-serif', lineHeight: '33px' }}>Analytics</h1>
          <div className="flex items-center gap-3">
            <AnalyticsFilters
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              departmentFilter={departmentFilter}
              onDepartmentFilterChange={setDepartmentFilter}
              granularity={granularity}
              onGranularityChange={setGranularity}
            />
          </div>
        </div>

        {/* Error State */}
        {hasError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            Failed to load analytics data. Please try again.
          </div>
        )}

        <AnalyticsAllCharts
          sentData={sentQuery.data?.chartData || []}
          receivedData={receivedQuery.data?.chartData || []}
          engagementData={engagementQuery.data?.chartData || []}
          redemptionsData={redemptionsQuery.data?.chartData || []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default Analytics;

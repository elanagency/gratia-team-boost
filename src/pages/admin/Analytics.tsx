import React, { useState } from "react";
import { subDays } from "date-fns";
import { BarChart3, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters";
import { AnalyticsAllCharts } from "@/components/analytics/AnalyticsAllCharts";
import { AnalyticsDataTable } from "@/components/analytics/AnalyticsDataTable";
import {
  useAnalyticsData,
  type SegmentType,
  type GranularityType,
  type DateRange,
} from "@/hooks/useAnalyticsData";

const Analytics = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    start: subDays(new Date(), 30),
    end: new Date(),
  });
  const [segmentBy, setSegmentBy] = useState<SegmentType>("none");
  const [granularity, setGranularity] = useState<GranularityType>("monthly");
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

  const sentQuery = useAnalyticsData({ metric: "sent", dateRange, segmentBy, granularity });
  const receivedQuery = useAnalyticsData({ metric: "received", dateRange, segmentBy, granularity });
  const engagementQuery = useAnalyticsData({ metric: "engagement", dateRange, segmentBy, granularity });
  const redemptionsQuery = useAnalyticsData({ metric: "redemptions", dateRange, segmentBy, granularity });

  const isLoading = sentQuery.isLoading || receivedQuery.isLoading || engagementQuery.isLoading || redemptionsQuery.isLoading;
  const hasError = sentQuery.error || receivedQuery.error || engagementQuery.error || redemptionsQuery.error;

  return (
    <div className="-mx-4 -mt-16 -mb-4 lg:-mx-[60px] lg:-mt-[72px] lg:-mb-4 min-h-screen" style={{ padding: "22.5px 135.5px" }}>
      <div className="space-y-6">
        {/* Page Header with Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#0F0533', fontFamily: 'Inter, sans-serif', lineHeight: '33px' }}>Analytics</h1>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-md border bg-background" style={{ borderColor: '#E8E6F0' }}>
              <button
                className={cn(
                  "h-9 w-9 inline-flex items-center justify-center rounded-l-md rounded-r-none transition-colors",
                  viewMode === "chart" ? "bg-gray-100" : "hover:bg-gray-100",
                )}
                onClick={() => setViewMode("chart")}
              >
                <BarChart3 className="h-4 w-4" />
              </button>
              <button
                className={cn(
                  "h-9 w-9 inline-flex items-center justify-center rounded-r-md rounded-l-none transition-colors",
                  viewMode === "table" ? "bg-gray-100" : "hover:bg-gray-100",
                )}
                onClick={() => setViewMode("table")}
              >
                <Table2 className="h-4 w-4" />
              </button>
            </div>
            <AnalyticsFilters
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              segmentBy={segmentBy}
              onSegmentChange={setSegmentBy}
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

        {viewMode === "chart" ? (
          <AnalyticsAllCharts
            sentData={sentQuery.data?.chartData || []}
            receivedData={receivedQuery.data?.chartData || []}
            engagementData={engagementQuery.data?.chartData || []}
            redemptionsData={redemptionsQuery.data?.chartData || []}
            isLoading={isLoading}
          />
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold mb-3" style={{ color: '#0F0533' }}>Recognition Sent</h2>
              <AnalyticsDataTable data={sentQuery.data?.tableData || []} isLoading={sentQuery.isLoading} metric="sent" segmentBy={segmentBy} />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-3" style={{ color: '#0F0533' }}>Recognition Received</h2>
              <AnalyticsDataTable data={receivedQuery.data?.tableData || []} isLoading={receivedQuery.isLoading} metric="received" segmentBy={segmentBy} />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-3" style={{ color: '#0F0533' }}>Participation Rate</h2>
              <AnalyticsDataTable data={engagementQuery.data?.tableData || []} isLoading={engagementQuery.isLoading} metric="engagement" segmentBy={segmentBy} />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-3" style={{ color: '#0F0533' }}>Redemptions</h2>
              <AnalyticsDataTable data={redemptionsQuery.data?.tableData || []} isLoading={redemptionsQuery.isLoading} metric="redemptions" segmentBy={segmentBy} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;

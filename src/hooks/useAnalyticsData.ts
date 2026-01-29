import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { startOfDay, endOfDay, format, startOfWeek, eachDayOfInterval, eachWeekOfInterval } from "date-fns";

export type MetricType = 'received' | 'sent' | 'engagement' | 'redemptions';
export type SegmentType = 'none' | 'department' | 'person';
export type GranularityType = 'daily' | 'weekly';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label: string;
  segments?: Record<string, number>;
}

export interface TableDataRow {
  date: string;
  value: number;
  segmentName?: string;
}

export interface AnalyticsData {
  chartData: ChartDataPoint[];
  tableData: TableDataRow[];
  total: number;
  average: number;
  trend: number; // percentage change from previous period
}

interface UseAnalyticsDataParams {
  metric: MetricType;
  dateRange: DateRange;
  segmentBy: SegmentType;
  granularity: GranularityType;
}

export function useAnalyticsData({
  metric,
  dateRange,
  segmentBy,
  granularity,
}: UseAnalyticsDataParams) {
  const { companyId } = useAuth();

  return useQuery({
    queryKey: ['analytics', metric, dateRange.start.toISOString(), dateRange.end.toISOString(), segmentBy, granularity, companyId],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!companyId) {
        return { chartData: [], tableData: [], total: 0, average: 0, trend: 0 };
      }

      const startDate = startOfDay(dateRange.start);
      const endDate = endOfDay(dateRange.end);

      switch (metric) {
        case 'received':
          return fetchReceivedData(companyId, startDate, endDate, segmentBy, granularity);
        case 'sent':
          return fetchSentData(companyId, startDate, endDate, segmentBy, granularity);
        case 'engagement':
          return fetchEngagementData(companyId, startDate, endDate, granularity);
        case 'redemptions':
          return fetchRedemptionsData(companyId, startDate, endDate, segmentBy, granularity);
        default:
          return { chartData: [], tableData: [], total: 0, average: 0, trend: 0 };
      }
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

async function fetchReceivedData(
  companyId: string,
  startDate: Date,
  endDate: Date,
  segmentBy: SegmentType,
  granularity: GranularityType
): Promise<AnalyticsData> {
  const { data: transactions, error } = await supabase
    .from('point_transactions')
    .select(`
      id,
      points,
      created_at,
      recipient_profile_id,
      profiles!point_transactions_recipient_profile_id_fkey (
        first_name,
        last_name,
        department_id,
        departments (name)
      )
    `)
    .eq('company_id', companyId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching received data:', error);
    throw error;
  }

  return processTransactionData(transactions || [], startDate, endDate, segmentBy, granularity, 'recipient');
}

async function fetchSentData(
  companyId: string,
  startDate: Date,
  endDate: Date,
  segmentBy: SegmentType,
  granularity: GranularityType
): Promise<AnalyticsData> {
  const { data: transactions, error } = await supabase
    .from('point_transactions')
    .select(`
      id,
      points,
      created_at,
      sender_profile_id,
      profiles!point_transactions_sender_profile_id_fkey (
        first_name,
        last_name,
        department_id,
        departments (name)
      )
    `)
    .eq('company_id', companyId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching sent data:', error);
    throw error;
  }

  return processTransactionData(transactions || [], startDate, endDate, segmentBy, granularity, 'sender');
}

async function fetchEngagementData(
  companyId: string,
  startDate: Date,
  endDate: Date,
  granularity: GranularityType
): Promise<AnalyticsData> {
  // Get total active members
  const { data: totalMembers, error: membersError } = await supabase
    .from('profiles')
    .select('id')
    .eq('company_id', companyId)
    .eq('status', 'active');

  if (membersError) throw membersError;

  const totalMemberCount = totalMembers?.length || 0;

  // Get point transactions to calculate unique participants
  const { data: transactions, error: txError } = await supabase
    .from('point_transactions')
    .select('sender_profile_id, recipient_profile_id, created_at')
    .eq('company_id', companyId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true });

  if (txError) throw txError;

  const intervals = granularity === 'daily'
    ? eachDayOfInterval({ start: startDate, end: endDate })
    : eachWeekOfInterval({ start: startDate, end: endDate });

  const chartData: ChartDataPoint[] = intervals.map((intervalStart) => {
    const intervalEnd = granularity === 'daily'
      ? endOfDay(intervalStart)
      : endOfDay(new Date(intervalStart.getTime() + 6 * 24 * 60 * 60 * 1000));

    const intervalTx = (transactions || []).filter(tx => {
      const txDate = new Date(tx.created_at);
      return txDate >= intervalStart && txDate <= intervalEnd;
    });

    const uniqueParticipants = new Set([
      ...intervalTx.map(tx => tx.sender_profile_id),
      ...intervalTx.map(tx => tx.recipient_profile_id),
    ]);

    const engagementRate = totalMemberCount > 0
      ? Math.round((uniqueParticipants.size / totalMemberCount) * 100)
      : 0;

    return {
      date: format(intervalStart, granularity === 'daily' ? 'MMM d' : 'MMM d'),
      value: engagementRate,
      label: `${engagementRate}%`,
    };
  });

  const total = chartData.reduce((sum, d) => sum + d.value, 0);
  const average = chartData.length > 0 ? Math.round(total / chartData.length) : 0;

  return {
    chartData,
    tableData: chartData.map(d => ({ date: d.date, value: d.value })),
    total: average, // For engagement, total is the average rate
    average,
    trend: 0, // Would need previous period data to calculate
  };
}

async function fetchRedemptionsData(
  companyId: string,
  startDate: Date,
  endDate: Date,
  segmentBy: SegmentType,
  granularity: GranularityType
): Promise<AnalyticsData> {
  const { data: redemptions, error } = await supabase
    .from('redemptions')
    .select(`
      id,
      points_spent,
      redemption_date,
      user_id
    `)
    .eq('company_id', companyId)
    .gte('redemption_date', startDate.toISOString())
    .lte('redemption_date', endDate.toISOString())
    .order('redemption_date', { ascending: true });

  if (error) {
    console.error('Error fetching redemptions:', error);
    throw error;
  }

  const intervals = granularity === 'daily'
    ? eachDayOfInterval({ start: startDate, end: endDate })
    : eachWeekOfInterval({ start: startDate, end: endDate });

  const chartData: ChartDataPoint[] = intervals.map((intervalStart) => {
    const intervalEnd = granularity === 'daily'
      ? endOfDay(intervalStart)
      : endOfDay(new Date(intervalStart.getTime() + 6 * 24 * 60 * 60 * 1000));

    const intervalRedemptions = (redemptions || []).filter(r => {
      const rDate = new Date(r.redemption_date);
      return rDate >= intervalStart && rDate <= intervalEnd;
    });

    const totalPoints = intervalRedemptions.reduce((sum, r) => sum + r.points_spent, 0);

    return {
      date: format(intervalStart, granularity === 'daily' ? 'MMM d' : 'MMM d'),
      value: totalPoints,
      label: totalPoints.toLocaleString(),
    };
  });

  const total = chartData.reduce((sum, d) => sum + d.value, 0);
  const average = chartData.length > 0 ? Math.round(total / chartData.length) : 0;

  return {
    chartData,
    tableData: chartData.map(d => ({ date: d.date, value: d.value })),
    total,
    average,
    trend: 0,
  };
}

function processTransactionData(
  transactions: any[],
  startDate: Date,
  endDate: Date,
  segmentBy: SegmentType,
  granularity: GranularityType,
  profileType: 'sender' | 'recipient'
): AnalyticsData {
  const intervals = granularity === 'daily'
    ? eachDayOfInterval({ start: startDate, end: endDate })
    : eachWeekOfInterval({ start: startDate, end: endDate });

  const chartData: ChartDataPoint[] = intervals.map((intervalStart) => {
    const intervalEnd = granularity === 'daily'
      ? endOfDay(intervalStart)
      : endOfDay(new Date(intervalStart.getTime() + 6 * 24 * 60 * 60 * 1000));

    const intervalTx = transactions.filter(tx => {
      const txDate = new Date(tx.created_at);
      return txDate >= intervalStart && txDate <= intervalEnd;
    });

    const totalPoints = intervalTx.reduce((sum, tx) => sum + tx.points, 0);

    const dataPoint: ChartDataPoint = {
      date: format(intervalStart, granularity === 'daily' ? 'MMM d' : 'MMM d'),
      value: totalPoints,
      label: totalPoints.toLocaleString(),
    };

    if (segmentBy !== 'none') {
      const segments: Record<string, number> = {};
      intervalTx.forEach(tx => {
        const profile = tx.profiles;
        if (profile) {
          const segmentKey = segmentBy === 'department'
            ? profile.departments?.name || 'No Department'
            : `${profile.first_name} ${profile.last_name}`;
          segments[segmentKey] = (segments[segmentKey] || 0) + tx.points;
        }
      });
      dataPoint.segments = segments;
    }

    return dataPoint;
  });

  const total = chartData.reduce((sum, d) => sum + d.value, 0);
  const average = chartData.length > 0 ? Math.round(total / chartData.length) : 0;

  const tableData: TableDataRow[] = chartData.map(d => ({
    date: d.date,
    value: d.value,
  }));

  return {
    chartData,
    tableData,
    total,
    average,
    trend: 0,
  };
}

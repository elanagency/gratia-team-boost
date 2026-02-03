import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { startOfDay, endOfDay, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, endOfMonth } from "date-fns";

export type MetricType = 'received' | 'sent' | 'engagement' | 'redemptions' | 'logins';
export type SegmentType = 'none' | 'department' | 'person';
export type GranularityType = 'daily' | 'weekly' | 'monthly';

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

// Calculate trend percentage comparing current to previous period
function calculateTrend(currentTotal: number, previousTotal: number): number {
  if (previousTotal === 0) return currentTotal > 0 ? 100 : 0;
  return Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
}

// Calculate previous period dates based on current period
function getPreviousPeriodDates(startDate: Date, endDate: Date): { prevStart: Date; prevEnd: Date } {
  const periodLength = endDate.getTime() - startDate.getTime();
  const prevEnd = new Date(startDate.getTime() - 1); // Day before current start
  const prevStart = new Date(prevEnd.getTime() - periodLength);
  return { prevStart: startOfDay(prevStart), prevEnd: endOfDay(prevEnd) };
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
      const { prevStart, prevEnd } = getPreviousPeriodDates(startDate, endDate);

      switch (metric) {
        case 'received':
          return fetchReceivedDataWithTrend(companyId, startDate, endDate, prevStart, prevEnd, segmentBy, granularity);
        case 'sent':
          return fetchSentDataWithTrend(companyId, startDate, endDate, prevStart, prevEnd, segmentBy, granularity);
        case 'engagement':
          return fetchEngagementDataWithTrend(companyId, startDate, endDate, prevStart, prevEnd, granularity);
        case 'redemptions':
          return fetchRedemptionsDataWithTrend(companyId, startDate, endDate, prevStart, prevEnd, segmentBy, granularity);
        case 'logins':
          return fetchLoginsDataWithTrend(companyId, startDate, endDate, prevStart, prevEnd, segmentBy, granularity);
        default:
          return { chartData: [], tableData: [], total: 0, average: 0, trend: 0 };
      }
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

async function fetchReceivedDataWithTrend(
  companyId: string,
  startDate: Date,
  endDate: Date,
  prevStart: Date,
  prevEnd: Date,
  segmentBy: SegmentType,
  granularity: GranularityType
): Promise<AnalyticsData> {
  // Fetch current and previous period in parallel
  const [currentData, previousData] = await Promise.all([
    fetchTransactionData(companyId, startDate, endDate, segmentBy, granularity, 'recipient'),
    fetchTransactionTotal(companyId, prevStart, prevEnd, 'recipient'),
  ]);

  const trend = calculateTrend(currentData.total, previousData);
  return { ...currentData, trend };
}

async function fetchSentDataWithTrend(
  companyId: string,
  startDate: Date,
  endDate: Date,
  prevStart: Date,
  prevEnd: Date,
  segmentBy: SegmentType,
  granularity: GranularityType
): Promise<AnalyticsData> {
  const [currentData, previousData] = await Promise.all([
    fetchTransactionData(companyId, startDate, endDate, segmentBy, granularity, 'sender'),
    fetchTransactionTotal(companyId, prevStart, prevEnd, 'sender'),
  ]);

  const trend = calculateTrend(currentData.total, previousData);
  return { ...currentData, trend };
}

async function fetchEngagementDataWithTrend(
  companyId: string,
  startDate: Date,
  endDate: Date,
  prevStart: Date,
  prevEnd: Date,
  granularity: GranularityType
): Promise<AnalyticsData> {
  const [currentData, previousEngagement] = await Promise.all([
    fetchEngagementData(companyId, startDate, endDate, granularity),
    fetchEngagementTotal(companyId, prevStart, prevEnd),
  ]);

  const trend = calculateTrend(currentData.average, previousEngagement);
  return { ...currentData, trend };
}

async function fetchRedemptionsDataWithTrend(
  companyId: string,
  startDate: Date,
  endDate: Date,
  prevStart: Date,
  prevEnd: Date,
  segmentBy: SegmentType,
  granularity: GranularityType
): Promise<AnalyticsData> {
  const [currentData, previousTotal] = await Promise.all([
    fetchRedemptionsData(companyId, startDate, endDate, segmentBy, granularity),
    fetchRedemptionsTotal(companyId, prevStart, prevEnd),
  ]);

  const trend = calculateTrend(currentData.total, previousTotal);
  return { ...currentData, trend };
}

async function fetchLoginsDataWithTrend(
  companyId: string,
  startDate: Date,
  endDate: Date,
  prevStart: Date,
  prevEnd: Date,
  segmentBy: SegmentType,
  granularity: GranularityType
): Promise<AnalyticsData> {
  const [currentData, previousTotal] = await Promise.all([
    fetchLoginsData(companyId, startDate, endDate, segmentBy, granularity),
    fetchLoginsTotal(companyId, prevStart, prevEnd),
  ]);

  const trend = calculateTrend(currentData.total, previousTotal);
  return { ...currentData, trend };
}

// Helper to fetch just the total for previous period (transactions)
async function fetchTransactionTotal(
  companyId: string,
  startDate: Date,
  endDate: Date,
  profileType: 'sender' | 'recipient'
): Promise<number> {
  const fk = profileType === 'sender' ? 'sender_profile_id' : 'recipient_profile_id';
  const { data, error } = await supabase
    .from('point_transactions')
    .select('points')
    .eq('company_id', companyId)
    .gt('points', 0)  // Only positive transactions (excludes redemptions)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (error) throw error;
  return (data || []).reduce((sum, tx) => sum + tx.points, 0);
}

// Helper to fetch engagement rate for previous period
async function fetchEngagementTotal(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const [membersResult, txResult] = await Promise.all([
    supabase.from('profiles').select('id').eq('company_id', companyId).eq('status', 'active'),
    supabase.from('point_transactions')
      .select('sender_profile_id, recipient_profile_id')
      .eq('company_id', companyId)
      .gt('points', 0)  // Only positive transactions
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString()),
  ]);

  const totalMembers = membersResult.data?.length || 0;
  const transactions = txResult.data || [];
  const uniqueParticipants = new Set([
    ...transactions.map(tx => tx.sender_profile_id),
    ...transactions.map(tx => tx.recipient_profile_id),
  ]);

  return totalMembers > 0 ? Math.round((uniqueParticipants.size / totalMembers) * 100) : 0;
}

// Helper to fetch redemptions total for previous period
async function fetchRedemptionsTotal(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const { data, error } = await supabase
    .from('redemptions')
    .select('points_spent')
    .eq('company_id', companyId)
    .gte('redemption_date', startDate.toISOString())
    .lte('redemption_date', endDate.toISOString());

  if (error) throw error;
  return (data || []).reduce((sum, r) => sum + r.points_spent, 0);
}

// Helper to fetch logins total for previous period
async function fetchLoginsTotal(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const { data, error } = await supabase
    .from('login_events')
    .select('id')
    .eq('company_id', companyId)
    .gte('logged_in_at', startDate.toISOString())
    .lte('logged_in_at', endDate.toISOString());

  if (error) throw error;
  return data?.length || 0;
}

async function fetchTransactionData(
  companyId: string,
  startDate: Date,
  endDate: Date,
  segmentBy: SegmentType,
  granularity: GranularityType,
  profileType: 'sender' | 'recipient'
): Promise<Omit<AnalyticsData, 'trend'>> {
  const fk = profileType === 'sender' 
    ? 'point_transactions_sender_profile_id_fkey' 
    : 'point_transactions_recipient_profile_id_fkey';
  
  const { data: transactions, error } = await supabase
    .from('point_transactions')
    .select(`
      id,
      points,
      created_at,
      ${profileType}_profile_id,
      profiles!${fk} (
        first_name,
        last_name,
        department_id,
        departments (name)
      )
    `)
    .eq('company_id', companyId)
    .gt('points', 0)  // Only positive transactions (excludes redemptions)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching transaction data:', error);
    throw error;
  }

  return processTransactionData(transactions || [], startDate, endDate, segmentBy, granularity);
}

async function fetchEngagementData(
  companyId: string,
  startDate: Date,
  endDate: Date,
  granularity: GranularityType
): Promise<Omit<AnalyticsData, 'trend'>> {
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
    .gt('points', 0)  // Only positive transactions
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true });

  if (txError) throw txError;

  const intervals = granularity === 'daily'
    ? eachDayOfInterval({ start: startDate, end: endDate })
    : granularity === 'weekly'
      ? eachWeekOfInterval({ start: startDate, end: endDate })
      : eachMonthOfInterval({ start: startDate, end: endDate });

  const chartData: ChartDataPoint[] = intervals.map((intervalStart) => {
    const intervalEnd = granularity === 'daily'
      ? endOfDay(intervalStart)
      : granularity === 'weekly'
        ? endOfDay(new Date(intervalStart.getTime() + 6 * 24 * 60 * 60 * 1000))
        : endOfMonth(intervalStart);

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
      date: format(intervalStart, granularity === 'monthly' ? 'MMM yyyy' : 'MMM d'),
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
  };
}

async function fetchRedemptionsData(
  companyId: string,
  startDate: Date,
  endDate: Date,
  segmentBy: SegmentType,
  granularity: GranularityType
): Promise<Omit<AnalyticsData, 'trend'>> {
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

  // If segmenting, fetch profile data
  let profilesMap: Record<string, { first_name: string; last_name: string; department_name: string | null }> = {};
  
  if (segmentBy !== 'none' && redemptions && redemptions.length > 0) {
    const uniqueUserIds = [...new Set(redemptions.map(r => r.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, departments(name)')
      .in('id', uniqueUserIds);
    
    if (profiles) {
      profiles.forEach((p: any) => {
        profilesMap[p.id] = {
          first_name: p.first_name,
          last_name: p.last_name,
          department_name: p.departments?.name || null,
        };
      });
    }
  }

  const intervals = granularity === 'daily'
    ? eachDayOfInterval({ start: startDate, end: endDate })
    : granularity === 'weekly'
      ? eachWeekOfInterval({ start: startDate, end: endDate })
      : eachMonthOfInterval({ start: startDate, end: endDate });

  const chartData: ChartDataPoint[] = intervals.map((intervalStart) => {
    const intervalEnd = granularity === 'daily'
      ? endOfDay(intervalStart)
      : granularity === 'weekly'
        ? endOfDay(new Date(intervalStart.getTime() + 6 * 24 * 60 * 60 * 1000))
        : endOfMonth(intervalStart);

    const intervalRedemptions = (redemptions || []).filter(r => {
      const rDate = new Date(r.redemption_date);
      return rDate >= intervalStart && rDate <= intervalEnd;
    });

    const totalPoints = intervalRedemptions.reduce((sum, r) => sum + r.points_spent, 0);

    const dataPoint: ChartDataPoint = {
      date: format(intervalStart, granularity === 'monthly' ? 'MMM yyyy' : 'MMM d'),
      value: totalPoints,
      label: totalPoints.toLocaleString(),
    };

    if (segmentBy !== 'none') {
      const segments: Record<string, number> = {};
      intervalRedemptions.forEach(r => {
        const profile = profilesMap[r.user_id];
        if (profile) {
          const segmentKey = segmentBy === 'department'
            ? profile.department_name || 'No Department'
            : `${profile.first_name} ${profile.last_name}`;
          segments[segmentKey] = (segments[segmentKey] || 0) + r.points_spent;
        }
      });
      dataPoint.segments = segments;
    }

    return dataPoint;
  });

  const total = chartData.reduce((sum, d) => sum + d.value, 0);
  const average = chartData.length > 0 ? Math.round(total / chartData.length) : 0;

  // Build table data with segments if applicable
  const tableData: TableDataRow[] = buildTableData(chartData, segmentBy);

  return {
    chartData,
    tableData,
    total,
    average,
  };
}

async function fetchLoginsData(
  companyId: string,
  startDate: Date,
  endDate: Date,
  segmentBy: SegmentType,
  granularity: GranularityType
): Promise<Omit<AnalyticsData, 'trend'>> {
  // Query login_events
  const { data: loginEvents, error } = await supabase
    .from('login_events')
    .select('id, logged_in_at, user_id')
    .eq('company_id', companyId)
    .gte('logged_in_at', startDate.toISOString())
    .lte('logged_in_at', endDate.toISOString())
    .order('logged_in_at', { ascending: true });

  if (error) {
    console.error('Error fetching login events:', error);
    throw error;
  }

  // If segmenting, fetch profile data for users
  let profilesMap: Record<string, { first_name: string; last_name: string; department_name: string | null }> = {};
  
  if (segmentBy !== 'none' && loginEvents && loginEvents.length > 0) {
    const uniqueUserIds = [...new Set(loginEvents.map(e => e.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, departments(name)')
      .in('id', uniqueUserIds);
    
    if (profiles) {
      profiles.forEach((p: any) => {
        profilesMap[p.id] = {
          first_name: p.first_name,
          last_name: p.last_name,
          department_name: p.departments?.name || null,
        };
      });
    }
  }

  const intervals = granularity === 'daily'
    ? eachDayOfInterval({ start: startDate, end: endDate })
    : granularity === 'weekly'
      ? eachWeekOfInterval({ start: startDate, end: endDate })
      : eachMonthOfInterval({ start: startDate, end: endDate });

  const chartData: ChartDataPoint[] = intervals.map((intervalStart) => {
    const intervalEnd = granularity === 'daily'
      ? endOfDay(intervalStart)
      : granularity === 'weekly'
        ? endOfDay(new Date(intervalStart.getTime() + 6 * 24 * 60 * 60 * 1000))
        : endOfMonth(intervalStart);

    const intervalLogins = (loginEvents || []).filter(event => {
      const eventDate = new Date(event.logged_in_at);
      return eventDate >= intervalStart && eventDate <= intervalEnd;
    });

    const loginCount = intervalLogins.length;

    const dataPoint: ChartDataPoint = {
      date: format(intervalStart, granularity === 'monthly' ? 'MMM yyyy' : 'MMM d'),
      value: loginCount,
      label: loginCount.toLocaleString(),
    };

    if (segmentBy !== 'none') {
      const segments: Record<string, number> = {};
      intervalLogins.forEach(event => {
        const profile = profilesMap[event.user_id];
        if (profile) {
          const segmentKey = segmentBy === 'department'
            ? profile.department_name || 'No Department'
            : `${profile.first_name} ${profile.last_name}`;
          segments[segmentKey] = (segments[segmentKey] || 0) + 1;
        }
      });
      dataPoint.segments = segments;
    }

    return dataPoint;
  });

  const total = chartData.reduce((sum, d) => sum + d.value, 0);
  const average = chartData.length > 0 ? Math.round(total / chartData.length) : 0;

  // Build table data with segments if applicable
  const tableData: TableDataRow[] = buildTableData(chartData, segmentBy);

  return {
    chartData,
    tableData,
    total,
    average,
  };
}

function processTransactionData(
  transactions: any[],
  startDate: Date,
  endDate: Date,
  segmentBy: SegmentType,
  granularity: GranularityType
): Omit<AnalyticsData, 'trend'> {
  const intervals = granularity === 'daily'
    ? eachDayOfInterval({ start: startDate, end: endDate })
    : granularity === 'weekly'
      ? eachWeekOfInterval({ start: startDate, end: endDate })
      : eachMonthOfInterval({ start: startDate, end: endDate });

  const chartData: ChartDataPoint[] = intervals.map((intervalStart) => {
    const intervalEnd = granularity === 'daily'
      ? endOfDay(intervalStart)
      : granularity === 'weekly'
        ? endOfDay(new Date(intervalStart.getTime() + 6 * 24 * 60 * 60 * 1000))
        : endOfMonth(intervalStart);

    const intervalTx = transactions.filter(tx => {
      const txDate = new Date(tx.created_at);
      return txDate >= intervalStart && txDate <= intervalEnd;
    });

    const totalPoints = intervalTx.reduce((sum, tx) => sum + tx.points, 0);

    const dataPoint: ChartDataPoint = {
      date: format(intervalStart, granularity === 'monthly' ? 'MMM yyyy' : 'MMM d'),
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

  // Build table data with segments if applicable
  const tableData: TableDataRow[] = buildTableData(chartData, segmentBy);

  return {
    chartData,
    tableData,
    total,
    average,
  };
}

// Helper to build table data, flattening segments when present
function buildTableData(chartData: ChartDataPoint[], segmentBy: SegmentType): TableDataRow[] {
  if (segmentBy === 'none') {
    return chartData.map(d => ({ date: d.date, value: d.value }));
  }

  // Flatten: one row per segment per date
  const rows: TableDataRow[] = [];
  chartData.forEach(d => {
    if (d.segments && Object.keys(d.segments).length > 0) {
      Object.entries(d.segments).forEach(([segmentName, value]) => {
        rows.push({ date: d.date, value, segmentName });
      });
    } else {
      rows.push({ date: d.date, value: d.value, segmentName: 'Total' });
    }
  });
  return rows;
}

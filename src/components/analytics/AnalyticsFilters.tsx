import React from "react";
import { Calendar } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useDepartments } from "@/hooks/useDepartments";
import type { DateRange, GranularityType } from "@/hooks/useAnalyticsData";

interface AnalyticsFiltersProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  departmentFilter: string;
  onDepartmentFilterChange: (department: string) => void;
  granularity: GranularityType;
  onGranularityChange: (granularity: GranularityType) => void;
}

type DatePreset = {
  label: string;
  getValue: () => DateRange;
};

const datePresets: DatePreset[] = [
  {
    label: "Last 7 days",
    getValue: () => ({ start: subDays(new Date(), 7), end: new Date() }),
  },
  {
    label: "Last 30 days",
    getValue: () => ({ start: subDays(new Date(), 30), end: new Date() }),
  },
  {
    label: "Last 90 days",
    getValue: () => ({ start: subDays(new Date(), 90), end: new Date() }),
  },
  {
    label: "This month",
    getValue: () => ({ start: startOfMonth(new Date()), end: new Date() }),
  },
  {
    label: "Last month",
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    },
  },
];

export function AnalyticsFilters({
  dateRange,
  onDateRangeChange,
  departmentFilter,
  onDepartmentFilterChange,
  granularity,
  onGranularityChange,
}: AnalyticsFiltersProps) {
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [selectedPreset, setSelectedPreset] = React.useState<string>("Last 30 days");
  const { departments } = useDepartments();

  const handlePresetSelect = (preset: DatePreset) => {
    setSelectedPreset(preset.label);
    onDateRangeChange(preset.getValue());
  };

  const handleCustomDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      setSelectedPreset("Custom");
      onDateRangeChange({ start: range.from, end: range.to });
    }
  };

  const activeGranularityStyle = {
    backgroundColor: '#0F0533',
    color: '#FFFFFF',
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Department Selector */}
      <Select
        value={departmentFilter}
        onValueChange={onDepartmentFilterChange}
      >
        <SelectTrigger className="w-[160px] rounded-[13.375px]" style={{ borderColor: '#E8E6F0', fontSize: 12, fontWeight: 500, color: '#0F0533' }}>
          <SelectValue placeholder="All Departments" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          {departments.map((dept) => (
            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Granularity Toggle */}
      <div className="flex items-center rounded-[13.375px] bg-[#F5F5F7] h-[33px] p-[1.875px]">
        {(["daily", "weekly", "monthly"] as GranularityType[]).map((g) => (
          <button
            key={g}
            className={cn(
              "rounded-[7.375px] px-[11px] py-[6px] text-xs font-medium capitalize transition-all",
              granularity !== g && "hover:bg-gray-200/60",
            )}
            style={granularity === g ? { ...activeGranularityStyle, boxShadow: '0 1px 2px rgba(0,0,0,0.08)' } : { color: '#9996AA' }}
            onClick={() => onGranularityChange(g)}
          >
            {g.charAt(0).toUpperCase() + g.slice(1)}
          </button>
        ))}
      </div>

      {/* Date Range Selector */}
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <button
            className="inline-flex items-center justify-start text-left font-normal rounded-[13.375px] border h-10 px-4 py-2 transition-colors hover:bg-gray-100"
            style={{ borderColor: '#E8E6F0', color: '#9996AA', fontSize: 12, fontWeight: 500 }}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Custom
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            <div className="flex flex-col w-auto min-w-0 border-r px-2 py-2 space-y-1">
              {datePresets.map((preset) => {
                const isActive = selectedPreset === preset.label;
                return (
                  <button
                    key={preset.label}
                    className={cn(
                      "text-left text-sm px-3 py-1.5 rounded-full whitespace-nowrap transition-colors",
                      !isActive && "hover:bg-gray-100 text-foreground",
                    )}
                    style={isActive ? { background: 'linear-gradient(135deg, #7F2BFE, #FC5BFF)', color: '#FFFFFF' } : undefined}
                    onClick={() => {
                      handlePresetSelect(preset);
                      setIsCalendarOpen(false);
                    }}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <div className="p-2">
              <CalendarComponent
                mode="range"
                selected={{ from: dateRange.start, to: dateRange.end }}
                onSelect={handleCustomDateSelect}
                numberOfMonths={1}
                disabled={{ after: new Date() }}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

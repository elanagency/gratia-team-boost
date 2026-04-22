import React from "react";
import { Calendar } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths, parse, isValid } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
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
        <PopoverContent className="w-auto p-0" align="end">
          <DateRangePickerContent
            initialRange={dateRange}
            onApply={(range) => {
              setSelectedPreset("Custom");
              onDateRangeChange(range);
              setIsCalendarOpen(false);
            }}
            selectedPreset={selectedPreset}
            onSelectPreset={(preset) => {
              setSelectedPreset(preset.label);
              onDateRangeChange(preset.getValue());
              setIsCalendarOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

const DATE_FORMAT = "MM / dd / yyyy";

interface DateRangePickerContentProps {
  initialRange: DateRange;
  onApply: (range: DateRange) => void;
  selectedPreset: string;
  onSelectPreset: (preset: DatePreset) => void;
}

function DateRangePickerContent({ initialRange, onApply, selectedPreset, onSelectPreset }: DateRangePickerContentProps) {
  const [draftStart, setDraftStart] = React.useState<Date | undefined>(initialRange.start);
  const [draftEnd, setDraftEnd] = React.useState<Date | undefined>(initialRange.end);
  const [activeField, setActiveField] = React.useState<"start" | "end">("start");
  const [startInput, setStartInput] = React.useState(initialRange.start ? format(initialRange.start, DATE_FORMAT) : "");
  const [endInput, setEndInput] = React.useState(initialRange.end ? format(initialRange.end, DATE_FORMAT) : "");

  React.useEffect(() => {
    setDraftStart(initialRange.start);
    setDraftEnd(initialRange.end);
    setStartInput(initialRange.start ? format(initialRange.start, DATE_FORMAT) : "");
    setEndInput(initialRange.end ? format(initialRange.end, DATE_FORMAT) : "");
  }, [initialRange.start, initialRange.end]);

  const handleDayClick = (day: Date) => {
    if (activeField === "start") {
      setDraftStart(day);
      setStartInput(format(day, DATE_FORMAT));
      if (draftEnd && day > draftEnd) {
        setDraftEnd(undefined);
        setEndInput("");
      }
      setActiveField("end");
    } else {
      if (draftStart && day < draftStart) {
        setDraftStart(day);
        setStartInput(format(day, DATE_FORMAT));
        setDraftEnd(undefined);
        setEndInput("");
        setActiveField("end");
      } else {
        setDraftEnd(day);
        setEndInput(format(day, DATE_FORMAT));
      }
    }
  };

  const handleInputChange = (field: "start" | "end", value: string) => {
    if (field === "start") setStartInput(value);
    else setEndInput(value);
    const parsed = parse(value, DATE_FORMAT, new Date());
    if (isValid(parsed)) {
      if (field === "start") setDraftStart(parsed);
      else setDraftEnd(parsed);
    }
  };

  const handleClear = () => {
    setDraftStart(undefined);
    setDraftEnd(undefined);
    setStartInput("");
    setEndInput("");
    setActiveField("start");
  };

  const canApply = !!draftStart && !!draftEnd && draftStart <= draftEnd;

  const activeRingStyle = { borderColor: '#7F2BFE', boxShadow: '0 0 0 3px rgba(127,43,254,0.12)', backgroundColor: 'rgba(127,43,254,0.04)' };
  const idleRingStyle = { borderColor: '#E8E6F0' };

  return (
    <div className="flex">
      {/* Presets */}
      <div className="flex flex-col w-auto min-w-0 border-r px-2 py-3 space-y-1">
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
              onClick={() => onSelectPreset(preset)}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Calendar + inputs */}
      <div className="flex flex-col p-3" style={{ minWidth: 560 }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex flex-col flex-1">
            <label className="text-xs font-medium mb-1" style={{ color: '#9996AA' }}>Start</label>
            <input
              type="text"
              value={startInput}
              onChange={(e) => handleInputChange("start", e.target.value)}
              onFocus={() => setActiveField("start")}
              placeholder="MM / DD / YYYY"
              className="h-9 rounded-[10px] border px-3 text-sm outline-none transition-all"
              style={activeField === "start" ? activeRingStyle : idleRingStyle}
            />
          </div>
          <div className="flex flex-col flex-1">
            <label className="text-xs font-medium mb-1" style={{ color: '#9996AA' }}>End</label>
            <input
              type="text"
              value={endInput}
              onChange={(e) => handleInputChange("end", e.target.value)}
              onFocus={() => setActiveField("end")}
              placeholder="MM / DD / YYYY"
              className="h-9 rounded-[10px] border px-3 text-sm outline-none transition-all"
              style={activeField === "end" ? activeRingStyle : idleRingStyle}
            />
          </div>
        </div>

        <CalendarComponent
          mode="range"
          selected={{ from: draftStart, to: draftEnd }}
          onDayClick={handleDayClick}
          numberOfMonths={2}
          defaultMonth={draftStart || new Date()}
          disabled={{ after: new Date() }}
          className="pointer-events-auto"
        />

        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
          <button
            onClick={handleClear}
            className="h-9 px-4 rounded-[10px] border text-sm font-medium transition-colors hover:bg-gray-100"
            style={{ borderColor: '#E8E6F0', color: '#0F0533' }}
          >
            Clear
          </button>
          <button
            onClick={() => canApply && onApply({ start: draftStart!, end: draftEnd! })}
            disabled={!canApply}
            className="h-9 px-4 rounded-[10px] text-sm font-medium text-white transition-opacity disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #7F2BFE, #FC5BFF)' }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

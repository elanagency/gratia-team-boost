
# Simplify Analytics Sidebar Menu

## Overview
Flatten the sidebar navigation by removing parent groupings and updating metric labels and icons based on client feedback.

---

## Changes Summary

| Current Label | New Label | Current Icon | New Icon |
|---------------|-----------|--------------|----------|
| Received | Recognition Received | TrendingDown | Coins |
| Sent | Recognition Sent | TrendingUp | Send |
| Rate | Engagement Rate | Users | Users (no change) |
| Points | Redemptions | Gift | Gift (no change) |
| Logins | User Activity | LogIn | LogIn (no change) |

---

## Visual Change

**Before (nested groups):**
```
▼ Recognition
    Received
    Sent
▼ Engagement
    Rate
▼ Redemptions
    Points
▼ Activity
    Logins
```

**After (flat list):**
```
Recognition Received
Recognition Sent
Engagement Rate
Redemptions
User Activity
```

---

## Technical Details

**File:** `src/components/analytics/AnalyticsMetricsSidebar.tsx`

### 1. Update imports
- Add `Coins` and `Send` icons
- Remove `ChevronDown`, `ChevronRight` (no longer needed for collapsibles)
- Remove `Collapsible` components import

### 2. Replace grouped structure with flat list

```typescript
interface MetricItem {
  id: MetricType;
  label: string;
  icon: React.ReactNode;
}

const metrics: MetricItem[] = [
  { id: "received", label: "Recognition Received", icon: <Coins className="h-4 w-4" /> },
  { id: "sent", label: "Recognition Sent", icon: <Send className="h-4 w-4" /> },
  { id: "engagement", label: "Engagement Rate", icon: <Users className="h-4 w-4" /> },
  { id: "redemptions", label: "Redemptions", icon: <Gift className="h-4 w-4" /> },
  { id: "logins", label: "User Activity", icon: <LogIn className="h-4 w-4" /> },
];
```

### 3. Simplify the render logic

Remove collapsible wrappers and render a simple list of buttons:

```tsx
<nav className="p-2 space-y-1">
  {metrics.map((metric) => (
    <button
      key={metric.id}
      onClick={() => onMetricChange(metric.id)}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors",
        "hover:bg-muted/50",
        selectedMetric === metric.id
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground"
      )}
    >
      {metric.icon}
      <span>{metric.label}</span>
    </button>
  ))}
</nav>
```

### 4. Remove unused code
- Remove `MetricGroup` interface
- Remove `metricGroups` array
- Remove `openGroups` state
- Remove `toggleGroup` function
- Remove `isGroupSelected` function

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/analytics/AnalyticsMetricsSidebar.tsx` | Replace nested collapsible structure with flat list; update labels and icons |


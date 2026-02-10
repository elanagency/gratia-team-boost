

# Fix: Engagement Rate Showing "Unknown" Segments

## Problem

The Engagement Rate metric does not support segmentation (by design -- it's calculated as a ratio of unique participants to total members). However, the Department and Person segment filters remain enabled when Engagement Rate is selected. When a user picks a segment, the table displays "Unknown" because no segment data is returned.

## Solution

Disable the segmentation filter when Engagement Rate is selected, and automatically reset it to "None" if a segment was previously chosen.

## Changes

### 1. `src/pages/admin/Analytics.tsx`
- When `selectedMetric` changes to `'engagement'`, automatically reset `segmentBy` to `'none'`
- Pass a `disableSegment` prop (or the metric itself) to `AnalyticsFilters` so it can disable the dropdown

### 2. `src/components/analytics/AnalyticsFilters.tsx`
- Accept a new prop indicating whether segmentation is disabled
- When disabled, show the segment dropdown as greyed out / non-interactive, or hide it entirely
- Optionally show a subtle tooltip: "Segmentation not available for Engagement Rate"

## Behavior

- User selects Engagement Rate -> segment filter resets to "None" and becomes disabled
- User switches back to any other metric -> segment filter re-enables
- No backend changes needed


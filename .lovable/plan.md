

## Add gray background wrappers to match Figma design

Three sections are missing the gray `#F9FAFB` rounded wrapper box around their visual component. The RecognitionDemo and BrandCatalog sections already have it. The CelebrationsSection has a similar wrapper already (`#E8EDF5`).

### 1. `src/components/SlackFeedSection.tsx`
Wrap the Slack channel mock card (line 67, the `max-w-[420px]` div) inside a new outer container:
```
<div className="w-full max-w-[576px] rounded-[24px] p-8" style={{ backgroundColor: '#F9FAFB' }}>
  <div className="w-full max-w-[420px] mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
    ...existing card content...
  </div>
</div>
```

### 2. `src/components/AnalyticsShowcase.tsx`
Wrap the analytics chart card (line 136, the `max-w-[420px]` div) inside a new outer container:
```
<div className="w-full max-w-[576px] rounded-[24px] p-8" style={{ backgroundColor: '#F9FAFB' }}>
  <div className="w-full max-w-[420px] mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
    ...existing card content...
  </div>
</div>
```

### 3. `src/components/ReviewCyclesSection.tsx`
Wrap the review card (line 59, the `max-w-[420px]` div) inside a new outer container:
```
<div className="w-full max-w-[576px] rounded-[24px] p-8" style={{ backgroundColor: '#F9FAFB' }}>
  <div className="w-full max-w-[420px] mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
    ...existing card content...
  </div>
</div>
```

All three follow the same pattern already established in RecognitionDemo: a `576px` wide, `24px` rounded, `#F9FAFB` background container with `p-8` padding, containing the existing white card centered with `mx-auto`.


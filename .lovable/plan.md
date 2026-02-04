

# Region Selection During Onboarding

## Overview

Currently, regions are only assignable by Platform Admins. This plan explores adding **automatic region detection** with **manual override** during company setup, providing a seamless experience for Company Admins.

---

## Proposed User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      COMPANY ADMIN SIGNUP                       │
├─────────────────────────────────────────────────────────────────┤
│  1. User fills signup form (name, company, email)               │
│  2. OTP verification                                            │
│  3. Redirect to /admin dashboard                                │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           REGION SETUP DIALOG (First Login)              │   │
│  │                                                          │   │
│  │  "🎉 Welcome to Grattia!"                               │   │
│  │                                                          │   │
│  │  We detected you're in:                                  │   │
│  │  ┌─────────────────────────────────────────────────┐     │   │
│  │  │  🇦🇺 Australia (AUD)                 ✓ Selected │     │   │
│  │  └─────────────────────────────────────────────────┘     │   │
│  │                                                          │   │
│  │  This determines which gift cards your team can          │   │
│  │  redeem. You can add more regions later by               │   │
│  │  contacting support.                                     │   │
│  │                                                          │   │
│  │  [ ] Also include Global gift cards (Visa, Mastercard)   │   │
│  │                                                          │   │
│  │              [Confirm & Continue]                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  4. Region saved to company_regions table                       │
│  5. User proceeds to dashboard                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Approach

### Option A: IP Geolocation Detection (Recommended)

Use a free IP geolocation API to detect the user's country during signup, then confirm/override in a setup dialog.

**API Options (all have free tiers):**

| API | Free Tier | Rate Limit | Response |
|-----|-----------|------------|----------|
| ipinfo.io | 50k/month | None | `{country: "AU", region: "Victoria"}` |
| country.is | Unlimited | 1000/min | `{country: "AU"}` |
| geoipapi.com | 10k/month | None | `{country_code: "AU", currency_code: "AUD"}` |

**Mapping IP country to Giftbit regions:**

| Country Code | Giftbit Region | Currency |
|--------------|----------------|----------|
| AU | AU | AUD |
| US | US | USD |
| CA | CA | CAD |
| GB | GB | GBP |
| NZ | NZ | NZD |
| Other | GLOBAL | USD |

### Option B: Manual Selection Only

Skip IP detection and let users choose from a dropdown. Simpler but less magical.

---

## Implementation Plan

### Phase 1: Create Region Setup Dialog Component

**New File:** `src/components/onboarding/RegionSetupDialog.tsx`

- Modal dialog shown on first dashboard visit
- Auto-detects country via IP (if Option A)
- Shows detected region with option to change
- Checkbox for including GLOBAL region
- Saves to `company_regions` table on confirm

### Phase 2: Add IP Geolocation Hook

**New File:** `src/hooks/useGeoLocation.ts`

```typescript
// Uses country.is API (free, no API key required)
const useGeoLocation = () => {
  const [country, setCountry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.country.is')
      .then(res => res.json())
      .then(data => setCountry(data.country)) // "AU", "US", etc.
      .catch(() => setCountry(null))
      .finally(() => setIsLoading(false));
  }, []);

  return { country, isLoading };
};
```

### Phase 3: Track Region Setup Completion

**Database Change:** Add `region_setup_complete` column to `companies` table

```sql
ALTER TABLE companies 
ADD COLUMN region_setup_complete BOOLEAN DEFAULT FALSE;
```

This flag determines whether to show the region setup dialog.

### Phase 4: Integrate Dialog into Dashboard

**File:** `src/pages/admin/Dashboard.tsx`

- Query company's `region_setup_complete` status
- If `false` and user is admin, show `RegionSetupDialog`
- On confirm, insert region(s) and set `region_setup_complete = true`

### Phase 5: Allow Region Change Before First Team Member

**File:** `src/components/settings/CompanyInformationCard.tsx`

- If no team members have been invited yet, allow region editing
- Once first member is invited, lock to read-only (current behavior)

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useGeoLocation.ts` | Create | IP geolocation detection hook |
| `src/components/onboarding/RegionSetupDialog.tsx` | Create | First-login region selection modal |
| `src/pages/admin/Dashboard.tsx` | Modify | Show dialog for new companies |
| `src/components/settings/CompanyInformationCard.tsx` | Modify | Allow editing until first invite |
| Database migration | Create | Add `region_setup_complete` to companies |

---

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| IP detection fails | Default to dropdown selection, pre-select GLOBAL |
| VPN user (wrong country) | Can manually change in dialog before confirming |
| User closes dialog without confirming | Dialog reappears on next dashboard visit |
| User wants to change region later | Contact support (existing flow) |
| Platform admin overrides | Platform admin can always change via CompanyDetailsCard |

---

## Summary

This approach provides:
1. **Automatic detection** - Reduces friction for new signups
2. **User confirmation** - Prevents wrong region assignments
3. **Graceful fallback** - Works even if IP detection fails
4. **Clean UX** - Happens once on first login, then stays out of the way
5. **Future flexibility** - Can add more regions via support


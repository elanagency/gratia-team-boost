

# PartnerStack Integration Plan

## Overview

Integrate PartnerStack to track partner referrals for both signups and paid conversions. This involves three parts: frontend tracking, signup attribution, and transaction reporting.

---

## What This Enables

- Partners share referral links (e.g., `grattia.partnerlinks.io/partner123`)
- When someone clicks a partner link and lands on your site, PartnerStack drops a cookie identifying which partner referred them
- When that visitor signs up, the partner gets credited
- When that customer makes a payment (Stripe subscription), the partner earns commission

---

## Implementation Steps

### Step 1: Add PartnerStackJS Tracking Snippet

Add the PartnerStackJS snippet to `index.html` in the `<head>` section. This uses your **public key** (which is safe to embed in frontend code).

Your public key from the screenshots: `pk_Oy99JnUkDuCWNdkCiZCAjmpVdoH6MzLx`

This snippet will:
- Detect when a visitor arrives via a partner referral link
- Store the partner attribution in a first-party cookie
- Make the `growsumo` object available globally for signup tracking

### Step 2: Track Signups in the Sign-Up Flow

After a user successfully verifies their OTP and creates an account in `SignUpForm.tsx`:
- Set customer data on the `growsumo` object (name, email, customer key)
- Call `growsumo.createSignup()` to report the signup to PartnerStack
- Use the user's Supabase auth ID as the `customer_key` for consistent tracking

### Step 3: Report Transactions (Server-Side)

Since Stripe is already connected to PartnerStack (visible in your screenshot), Stripe payment events should flow automatically to PartnerStack via their Stripe integration. No additional server-side code is needed for transaction tracking -- PartnerStack matches customers by email.

If email matching proves unreliable, we can optionally add the `customer_key` metadata to Stripe customers later.

### Step 4: Store the Secret Key

Store the PartnerStack **secret key** as a Supabase secret for any future server-side API calls (e.g., manually creating customers or transactions via the PartnerStack API).

---

## Technical Details

### Files to modify

| File | Change |
|------|--------|
| `index.html` | Add PartnerStackJS snippet in `<head>` with public key |
| `src/components/auth/SignUpForm.tsx` | Call `growsumo.createSignup()` after successful OTP verification |

### New files

| File | Purpose |
|------|---------|
| `src/vite-env.d.ts` (update) | Add TypeScript type declaration for `window.growsumo` |

### Secrets to add

| Secret | Purpose |
|--------|---------|
| `PARTNERSTACK_SECRET_KEY` | For any future server-side PartnerStack API calls |

### SignUpForm changes (pseudocode)

After successful OTP verification (line ~98 in SignUpForm.tsx), before navigating to `/admin`:

```text
1. Check if window.growsumo exists
2. Set growsumo.data.name = fullName
3. Set growsumo.data.email = user email
4. Set growsumo.data.customer_key = supabase auth user ID
5. Call growsumo.createSignup() 
6. Continue with navigation (don't block on this)
```

### PartnerStackJS snippet (for index.html)

The snippet loads the PartnerStackJS library with your public key, enabling automatic cookie-based partner attribution on every page.


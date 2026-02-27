

## Update PartnerStack snippet to match onboarding hub

The tracking script and signup attribution (step 3) are implemented, but the script snippet doesn't match the recommended one from PartnerStack's onboarding hub.

### What needs updating

**File: `index.html`** (PartnerStack script block, ~lines 42-55)

1. Change `gs.src` from `https://js.partnerstack.com/v1/` to `https://get.grattia.com/pr/js`
2. Update `growsumo._initialize` call to include the domain array: `["get.grattia.com","grattia.partnerlinks.io"]`
3. Replace `googrowsumoCallback` with `growsumoInit` to match PartnerStack's recommended callback name

### What's already done

- Signup tracking (step 3) in `SignUpForm.tsx` — sets `name`, `email`, `customer_key` and calls `createSignup()`. This is correct.

### What's outside of code (DNS)

- TXT record on `grattia.com` and CNAME for `get.grattia.com` → `partnerlinks.io` — these are configured in your domain registrar, not in the codebase.


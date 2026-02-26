

## Redesign Login and SignUp pages to match Figma

The Figma shows both pages with a light/white background, the floating pill-shaped Header (not the dark Navbar), gradient Continue button, uppercase labels, and a simplified footer. Currently both pages use dark navy background with the old Navbar.

### Changes

#### 1. `src/pages/Login.tsx`
- Replace dark background (`#0F0533`) with white/light background
- Replace `<Navbar />` with `<Header />` (the floating pill-shaped header from landing page)
- Replace `<Footer />` with a minimal footer (logo + tagline + copyright) matching the Figma screenshot
- Change heading to "Welcome back!" (with exclamation mark), black text instead of white
- Labels uppercase (`WORK EMAIL`), black/dark text
- Input fields: white background with light gray border (not dark purple)
- Continue button: gradient (`from-[#FC36FF] via-[#7F78F8] to-[#71F8F7]`) rounded-full, instead of solid `#F572FF`
- "Don't have an account? Sign up" in dark text
- OTP input fields also light-themed
- Add top padding to account for fixed header

#### 2. `src/pages/SignUp.tsx` + `src/components/auth/SignUpForm.tsx`
- Same light background treatment in `SignUp.tsx`
- Replace `<Navbar />` with `<Header />`
- Replace `<Footer />` with the same minimal footer
- Heading: "Create your account" in black
- Labels uppercase (`FULL NAME`, `COMPANY NAME`, `COMPANY EMAIL`)
- White inputs with light gray borders
- Gradient Continue button
- "Already have an account? Log in" and legal links in dark text
- Add top padding for fixed header

#### 3. Create `src/components/auth/AuthFooter.tsx` (minimal footer for auth pages)
- Dark navy background, centered Grattia logo, tagline "Making employee appreciation meaningful and rewarding.", copyright line
- Matches the simplified footer shown in the Figma screenshots


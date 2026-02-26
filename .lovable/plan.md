

## Update public pages to new light theme

Pages still using old dark design: **Terms**, **Privacy**, **ForgotPassword**, **ResetPassword**. NotFound is already light-themed but could use branding.

### Changes

#### 1. `src/pages/Terms.tsx`
- White background, black text
- Replace `<Navbar />` with `<Header />`
- Replace `<Footer />` with `<AuthFooter />` (or keep full `<Footer />` — these are content pages, full footer makes more sense)
- Section headings keep `text-grattia-accent`
- Add `pt-32` for fixed header clearance

#### 2. `src/pages/Privacy.tsx`
- Same treatment as Terms: white bg, black text, `<Header />`, full `<Footer />`, `pt-32`

#### 3. `src/pages/ForgotPassword.tsx`
- White background, black/dark text
- Replace `<Navbar />` with `<Header />`
- Replace `<Footer />` with `<AuthFooter />`
- Gradient button (`from-[#FC36FF] via-[#7F78F8] to-[#71F8F7]` rounded-full)
- Uppercase label, light-themed input (white bg, gray border)
- `pt-32` for header, update both views (form + email-sent confirmation)

#### 4. `src/pages/ResetPassword.tsx`
- Same light treatment across all 3 states (loading, invalid, form)
- Replace `<Navbar />` with `<Header />`, `<Footer />` with `<AuthFooter />`
- Gradient buttons, light inputs, uppercase labels, `pt-32`

#### 5. `src/pages/NotFound.tsx`
- Add `<Header />` and `<AuthFooter />`
- Style the "Return to Home" as a gradient button
- `pt-32` for header


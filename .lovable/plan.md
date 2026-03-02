

## Small Landing Page & Signup Fixes

### 1. TheSolution heading line break — `src/components/TheSolution.tsx`
- Insert a `<br />` before "not" so line 1 reads "Make recognition a daily habit," and line 2 reads "not an annual obligation."
- Line 29: `Make recognition a daily habit,<br className="hidden md:block" /> not an annual obligation.`

### 2. ProblemStatement heading line break — `src/components/ProblemStatement.tsx`
- Insert a `<br />` after "know." so the first sentence stays on line 1 and the second sentence starts on line 2.
- Line 33: `Your people appreciate each other more than you know.<br className="hidden md:block" /> The problem is, that appreciation is invisible.`

### 3. Final CTA "Get Started" button pulse — `src/components/FinalCTA.tsx`
- Add a subtle pulsing animation to the "Get Started" link using `animate-pulse` or a custom shadow pulse to draw attention without being garish. A shadow-based pulse (scaling box-shadow) is more tasteful than opacity pulse.
- Add a CSS animation class or inline Framer Motion animate prop with a repeating scale/shadow pulse.

### 4. SignUp form label — `src/components/auth/SignUpForm.tsx`
- Line 130: Change `Full Legal Name` to `Full Name`.


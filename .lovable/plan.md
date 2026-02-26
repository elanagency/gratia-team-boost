

## Fix Header navigation to work on all pages

The `scrollToSection` function only scrolls on the current page. On non-index pages (signup, login, etc.), the sections don't exist so nothing happens.

### Change in `src/components/Header.tsx`

- Import `useLocation` and `useNavigate` from react-router-dom
- Update `scrollToSection` to check if on `/`:
  - If yes: scroll to the section as before
  - If no: navigate to `/#section-id` (e.g. `/#features`)
- Also make the logo a `<Link to="/">` so users can click it to go home

### Change in `src/pages/Index.tsx`

- Add a `useEffect` that checks `window.location.hash` on mount and scrolls to the matching section (for when navigating from another page with a hash)


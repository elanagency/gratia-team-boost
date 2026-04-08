

# Link "View All" to Leaderboard Page

## Change
In `src/components/points/LeaderboardCard.tsx`, add `useNavigate` from react-router-dom and make the "View all" button navigate to `/leaderboard` on click.

## File modified
- `src/components/points/LeaderboardCard.tsx`
  - Add `import { useNavigate } from "react-router-dom"`
  - Add `const navigate = useNavigate()` inside the component
  - Add `onClick={() => navigate("/leaderboard")}` to the "View all" button (~line 131)


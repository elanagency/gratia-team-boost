# Fix: Send button stays disabled when using pills

## Problem
On the recognition composer (`GivePointsCard`), the Send button is disabled whenever there is no inline `@mention` or inline points balloon in the message body — even though the user has selected a teammate pill ("Jessica Acevedo"), a value pill ("Teamwork"), and a points pill ("25 pts") below the editor. The submit handler already supports both flows; only the disabled check is out of sync.

Current (line 828 in `src/components/points/GivePointsCard.tsx`):
```
disabled={isSubmitting || !text.trim() || mentions.length === 0 || points.length === 0}
```

## Fix
Accept either the pill selections or inline tokens, mirroring `handleSubmit`:

```
const hasRecipient = !!selectedTeammate || mentions.length > 0;
const hasPoints = (Number(pointsInputValue) > 0) || points.length > 0;

disabled={isSubmitting || !text.trim() || !hasRecipient || !hasPoints}
```

## File
- `src/components/points/GivePointsCard.tsx` — update the Send button's `disabled` expression (single-line change near line 828).

No business logic, no backend, no styling changes.



## Add falling confetti animation inside the white card

Currently the confetti particles radiate outward from a central point in the gray wrapper. The Figma shows confetti falling from top to bottom inside the white card area.

### Changes to `src/components/CelebrationsSection.tsx`

1. **Rework `generateParticles`**: Position particles randomly across the full width at the top of the white card (y near 0), with random x spread across the card width.

2. **Rework `ParticleShape` animation**: Change from radial burst to a falling animation — particles start at the top with `y: 0` and animate downward to the bottom of the card, with slight horizontal drift (wobble) for a natural confetti fall effect.

3. **Move the confetti container** from the gray wrapper into the white card `div`, so particles fall within the white card boundaries and are clipped by its `overflow-hidden rounded-xl`.

4. Keep the same colors, shapes, and sizes. Adjust count to ~30 particles for better coverage.


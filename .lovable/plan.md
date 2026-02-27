

## Make confetti animation loop continuously

The current animation uses `whileInView` with `viewport={{ once: true }}`, so it plays once and stops. Need to switch to a continuously looping animation.

### Changes to `src/components/CelebrationsSection.tsx`

**`ParticleShape` component (lines 45-63)**: Replace `whileInView` with `animate` and add `repeat: Infinity` + `repeatDelay` to the transition so particles continuously fall in a loop. Remove `viewport={{ once: true }}`. Each particle will loop independently with its own delay/duration, creating a natural continuous rain effect.

```tsx
<motion.div
  style={style}
  animate={{
    y: [0, 120, 280, 400],
    x: [0, particle.drift * 0.5, particle.drift, particle.drift * 0.8],
    opacity: [0, 1, 1, 0],
    rotate: [0, particle.rotation * 0.5, particle.rotation],
    scale: [0, 1, 1, 0.5],
  }}
  transition={{
    duration: particle.duration,
    delay: particle.delay,
    ease: 'easeIn',
    repeat: Infinity,
    repeatDelay: Math.random() * 2 + 0.5,
  }}
/>
```




# Remove Background Gradients

The AnalyticsShowcase and RecognitionDemo sections both have purple-tinted background gradients that should be plain white. Only the TheSolution section should have a gradient.

## Changes

### 1. `src/components/AnalyticsShowcase.tsx` (line 115)
- Change `style={{ background: 'linear-gradient(to bottom, #ffffff, #F5F3FF)' }}` to `style={{ background: '#ffffff' }}`

### 2. `src/components/RecognitionDemo.tsx` (line 64)
- Change `style={{ background: 'linear-gradient(to bottom, #F5F3FF, #ffffff)' }}` to `style={{ background: '#ffffff' }}`


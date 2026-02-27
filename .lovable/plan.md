

## Fix FinalCTA section typography and spacing to match Figma

### Current vs Figma

| Property | Current | Figma |
|----------|---------|-------|
| Heading font | Roboto | Poppins |
| Heading size | responsive (text-4xl to text-6xl) | 60px |
| Heading weight | bold (700) | 800 (extrabold) |
| Heading line-height | tight | 75px (125%) |
| Subtitle font | inherited | Poppins |
| Subtitle size | text-lg/xl | 20px |
| Subtitle color | #6B7280 | #4A5565 |
| Subtitle line-height | default | 32.5px (162.5%) |
| Two separate `<p>` tags | yes | single paragraph, second line separate |

### Changes to `src/components/FinalCTA.tsx`

1. **Heading**: Change to `font-[Poppins] text-[60px] font-extrabold leading-[75px]`, remove inline `fontFamily` style.

2. **Subtitle paragraphs**: Update color from `#6B7280` to `#4A5565`, add `font-[Poppins] text-[20px] leading-[32.5px]`, remove inline color style.

3. **Spacing**: Increase section vertical padding to match Figma's generous whitespace. Adjust `mb` values between heading, subtitles, and buttons to match the reference.


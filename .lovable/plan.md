

# Use Actual Brand Logos in Rewards Catalog

## Changes

### 1. Copy uploaded brand logos to `src/assets/brands/`
- `user-uploads://Image_Brand_Logo_-1.png` → Nike
- `user-uploads://Image_Brand_Logo_-2.png` → Visa
- `user-uploads://Image_Brand_Logo.png` → Amazon
- `user-uploads://Image_Brand_Logo_-5.png` → Apple
- `user-uploads://Image_Brand_Logo_-6.png` → Nordstrom
- `user-uploads://Image_Brand_Logo_-4.png` → Airbnb
- `user-uploads://Image_Brand_Logo_-3.png` → (appears to be another brand, possibly Lululemon or similar)

### 2. Update `src/components/BrandCatalogSection.tsx`
- Import all brand logo images from `src/assets/brands/`
- Change `BRANDS_ROW1` and `BRANDS_ROW2` from string arrays to objects with `name` and `logo` properties
- Update `BrandCard` to render an `<img>` tag instead of text, with the brand name as alt text
- Keep text fallback for brands without uploaded logos (Starbucks, Target, Uber, Sephora, DoorDash, Spotify, Netflix, Adidas, Walmart, Lululemon)


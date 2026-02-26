

# Refine FAQ Section UI to Match Figma Specs

## Changes to `src/components/FAQSection.tsx`

### 1. Active category tab styling
From Figma: background `#7F78F8` (not `#4F46E5`), border-radius `14px` (not full), padding `17px 24px 15px 24px`, box-shadow `0 10px 15px -3px rgba(...)`. White text.

### 2. FAQ accordion items
From Figma: border-radius `16px`, border `1px solid #F3F4F6`, white background `#FFFFFF`, padding `1px` on container. Remove the shadow styling currently applied.

### 3. Implementation
- Update active tab: `bg-[#7F78F8]` with `rounded-[14px]` and specific padding `py-[15px] px-[24px]`
- Update accordion items: `border-[#F3F4F6]` with `rounded-[16px]`, remove shadow classes


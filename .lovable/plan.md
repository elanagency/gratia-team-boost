

# Refine Leaderboard Table to Match Figma Specs

## Figma specs from screenshots

### Header row
| Property | Current | Figma |
|----------|---------|-------|
| Height | 42px | **41.5px** |
| Padding | 0 22.5px | **11.25px 18.75px 1px 18.75px** |
| Background | #F8F6FF | **#F5F5F7** |
| Font size | 11px | **12px** |
| Font weight | 600 | 600 (correct) |
| Line height | — | **18px** |
| Text transform | uppercase | Remove (Figma shows "Rank", "Name" in title case) |
| Letter spacing | 0.04em | Remove |

### Table rows
| Property | Current | Figma |
|----------|---------|-------|
| Avatar size | 34x34 | **33.75x33.75** |
| Name font | 13px/500 | **14px/500**, line-height **21px** |
| Role/subtitle font | 11px/400 | **12px/400**, line-height **18px** |
| Rank font | 13px/600 | **14px/600**, line-height **21px** |
| Department font | 13px/400, color #9996AA | **13px/400**, color **#0F0533**, line-height **19.5px** |
| Points font | 12px/600, color #22C55E | **13px/600**, color **#15803D**, line-height **19.5px**, text-align right |
| Points display | Green badge with bg | **Plain text, no badge/background** |

### Points column
The Figma shows points as plain right-aligned green text (no pill/badge background). Current code wraps points in a colored badge — this needs to be simplified to just the number.

## Changes in `src/pages/admin/Leaderboard.tsx`

1. **Header row**: Update height to 41.5, padding to `"11.25px 18.75px 1px 18.75px"`, background to `#F5F5F7`, font-size to 12, line-height 18px, remove `textTransform` and `letterSpacing`
2. **Row avatar**: Change from 34x34 to 33.75x33.75
3. **Row name**: Change font-size 13 to 14, line-height to 21px
4. **Row subtitle**: Change font-size 11 to 12, line-height to 18px
5. **Row rank**: Change font-size 13 to 14, line-height to 21px
6. **Row department**: Change color from #9996AA to #0F0533, add line-height 19.5px
7. **Row points**: Change to plain text (remove badge wrapper, background, borderRadius, padding), font-size 13, color #15803D, line-height 19.5px, text-align right

### File modified
- `src/pages/admin/Leaderboard.tsx`


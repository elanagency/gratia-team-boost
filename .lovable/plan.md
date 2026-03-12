

## Move GIF Button to Bottom Bar

Currently the GIF picker button sits in the **top toolbar** alongside Mention and Amount. The user wants it moved to the **bottom bar**, on the left side opposite the Send Recognition button.

### Change

**`src/components/points/GivePointsCard.tsx`**

1. Remove the `<GiphyPicker>` from the toolbar (lines 436-439)
2. Add the `<GiphyPicker>` to the bottom bar (line 473), on the left side before the summary text

The bottom bar layout becomes:
```
[ GIF button ] [ summary text ]                    [ Send Recognition ]
```

This is a single-file, ~5 line change.


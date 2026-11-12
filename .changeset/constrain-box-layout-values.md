---
'@luke-ui/react': minor
---

**Breaking:** Box and shared layout utility props accept a closed set of values instead of arbitrary
CSS. This applies to `Box`, `Stack`, `Cluster`, `Grid`, `Bleed`, `AspectRatio`, `ScrollFade`,
`Lockup`, and the other components that take layout props.

- `inlineSize`, `blockSize`, `minInlineSize`, and `minBlockSize` accept `"0"`, `auto`, `100%`,
  `min-content`, `max-content`, and `fit-content`.
- `maxInlineSize` and `maxBlockSize` accept the same values with `none` in place of `auto`.
  `maxInlineSize` also accepts the `container.448`, `container.672`, `container.896`,
  `container.1152`, and `container.1280` presets. `Container.maxInlineSize` is unchanged.
- `inset`, `insetBlock`, `insetBlockStart`, `insetBlockEnd`, `insetInline`, `insetInlineStart`, and
  `insetInlineEnd` accept spacing tokens such as `space.8`, `"0"`, and `auto`.
- `flexBasis` accepts the sizing keywords plus `content`. `flexGrow` and `flexShrink` still accept
  `"0"` and `"1"`. `order` accepts a number only.
- The `flex` shorthand prop is removed.

Previously some unsupported values, such as `inlineSize="space.32"`, compiled but produced invalid
CSS. They now fail type checking.

Migrate as follows:

- Replace `flex` with the longhands your layout needs. Check each use: the shorthand also sets basis
  and shrink. `flexGrow="1"` is usually enough. `flex={1}` sets a zero basis, so add `flexBasis="0"`
  when items must share space regardless of their content. Use `flexShrink="0"` to stop an item
  shrinking. Shrink `1` and basis `auto` are the defaults, so `flex="1 1 auto"` becomes
  `flexGrow="1"`.
- Write zero as a string: `minInlineSize={0}` becomes `minInlineSize="0"`. `order` stays numeric.
- Move fixed lengths, percentages, CSS functions, and `vars` values to `style`, for example
  `style={{ maxInlineSize: '42rem' }}` or `style={{ blockSize: vars.controlSize['40'] }}`.
- Move responsive one-off sizes to your own CSS, applied with `className`. Build the `@container`
  query from `breakpoints` in `@luke-ui/react/theme` so it matches the utility breakpoints and
  measures the same nearest size container.
- `maxInlineSize="42rem"` and similar widths can often use a `container.*` preset instead.

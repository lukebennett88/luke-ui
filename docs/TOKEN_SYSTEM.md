# Token system and representative controls (#716)

Decision record for freezing the 1.0 public token taxonomy before values become permanent. Parent:
epic [#709](https://github.com/lukebennett88/luke-ui/issues/709) / issue
[#716](https://github.com/lukebennett88/luke-ui/issues/716).

Inputs: `theme/contract.ts`, token docs, #707, settings fixture (#713), themes work (#715).

## Principles

1. Do not keep a token because it already exists.
2. Do not invent tokens for hypothetical flexibility.
3. A representative visual decision (TextField / ComboboxField / contrasting controls) should
   justify taxonomy (#707).
4. Fix system-level gaps before applying a redesign broadly.

## Split: themeable identity vs Luke-owned structure

| Kind                     | Examples                                                                                                        | Owner                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Themeable identity**   | Colour roles, neutral/accent character, font family + weights, radius character, depth/material, control finish | Theme packages / `defineTheme` (#715)                          |
| **Luke-owned structure** | Spacing scale, breakpoints, control/icon sizes, type size steps, motion durations/easing structure              | `@luke-ui/react` contract. Themes may not freely rewrite shape |

Structural **values** still get reviewed (spacing steps may change), but the **shape** of those
scales is Luke UI’s product contract, not every theme’s.

## Public `vars` audit stance

Inspect every public `vars` path and emitted `--luke-*` property for:

- actual Luke UI recipe/utility usage, or
- a demonstrated documented extension point.

Remove component-specific leakage from the public contract (tokens that only exist to encode one
component’s current geometry).

Seed areas from today’s contract (non-exhaustive):

- `color.*` semantic roles (background/foreground/border/text/overlay, …)
- `radius.*`
- `space.*`
- typography style objects + weights
- `motion.*`
- control / icon sizing (via related contracts)

Mark each path **retain**, **reshape**, or **remove** during the #707-informed pass — this record
does not freeze values yet.

## Representative redesign order

1. TextField / ComboboxField chrome and field anatomy (#707).
2. Enough contrasting controls (Button, Checkbox, Icon) to stress colour, type, space, radius,
   depth.
3. Apply settled tokens across Tactile, Paper, and the settings fixture theme.
4. Track remaining cross-component application as release blockers, not silent drift.

## Coordination

- #715 owns how themes author colour/radius/depth/fonts into CSS.
- #717 owns global baseline typography colour on `<body>`.
- #714 owns control naming. This issue owns their visual tokens.

## Next actions

1. Produce a path-by-path `vars` inventory spreadsheet/table with usage evidence.
2. Land #707-driven field visuals against a proposed taxonomy.
3. Update token docs and remove unused public paths before 1.0.

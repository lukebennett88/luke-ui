# #1023 same-role high Buttons

Decision record for [#1023](https://github.com/lukebennett88/luke-ui/issues/1023): a high Button
loses its filled shape on a role solid that uses the same fill. Luke UI documents this as a known
visual limitation and does not change the Button.

## Problem

A neutral high Button paints `accent.solid`, and a danger high Button paints `danger.solid`. Inside
a managed surface painted with the same solid, the Button paints its parent's colour in every state.
Its rest, hover, and pressed fills are then the same as a low Button's on that surface, although
Tactile's control finish and shadows can still differ between the two. A standard Button's light or
dark subtle face stands out more, so the prominence order looks reversed. Labels keep on-solid
contrast. The problem is shape and hierarchy, not text contrast.

Only these two pairs collide. Every other role solid differs from both high fills.

## Measurements

OKLab ΔE between the parent solid and each Button's rendered face at rest, from the bundled themes.
The flat fixture measures the same as Tactile.

| Theme   | Mode  | Parent   | Same-role high | Rung furthest from rest | Standard | Other-role high |
| ------- | ----- | -------- | -------------- | ----------------------- | -------- | --------------- |
| Paper   | Light | `accent` | 0.000          | 0.072                   | 0.552    | 0.287           |
| Paper   | Light | `danger` | 0.000          | 0.072                   | 0.482    | 0.287           |
| Paper   | Dark  | `accent` | 0.000          | 0.071                   | 0.245    | 0.251           |
| Paper   | Dark  | `danger` | 0.000          | 0.070                   | 0.273    | 0.251           |
| Tactile | Light | `accent` | 0.000          | 0.071                   | 0.444    | 0.268           |
| Tactile | Light | `danger` | 0.000          | 0.071                   | 0.472    | 0.268           |
| Tactile | Dark  | `accent` | 0.000          | 0.073                   | 0.176    | 0.239           |
| Tactile | Dark  | `danger` | 0.000          | 0.070                   | 0.251    | 0.239           |

"Rung furthest from rest" is the parent's `solid.pressed`. It is the most distinct same-hue face
among the role's solid states. It is also exactly the face of a low Button pressed on that surface.

## Decision

Document the collision as a known visual limitation. Do not change the Button.

- **Benefit of a fix.** Two Button and surface pairs, which a layout can avoid by placing the action
  on a contrasting surface.
- **Cost of a fix.** The fix needs a private inherited variable per role, set by every surface
  pairing, and a face treatment for the collision. The treatments explored below were not worth that
  complexity.

## Rejected

- **A shifted fill.** Painting `solid.hover` or `solid.pressed` at rest gives at most about 0.07 ΔE,
  against 0.18 to 0.55 for a standard face. The rest face matches a low Button's hover or pressed
  face, and the high Button has no further rung for its own pressed state.
- **An on-solid keyline**, alone or with a shifted fill. It does not fill the face, so the Button
  reads as an outline Button, below standard. The ring also looks like a focus indicator on a solid,
  which [#1022](https://github.com/lukebennett88/luke-ui/issues/1022) tracks. Paper's `none` shadows
  also invalidate a keyline stacked into the `box-shadow` list.
- **A neutral, inverse, or on-solid fill.** Only a face that leaves the role's hue reaches
  standard's separation. A danger high Button would stop looking destructive, and a neutral one
  would copy standard's face or lose the accent that marks the primary action.
- **A per-surface colour solver, runtime detection, or a public prop or token.** #1023 rules these
  out as disproportionate to two pairs.

Custom themes can create other near-matches between a high fill and a role solid. The compiler does
not gate high fills against role solids, and this decision adds no gate.

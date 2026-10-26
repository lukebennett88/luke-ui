# #925 adaptive Button states

Decision record for [#925](https://github.com/lukebennett88/luke-ui/issues/925): how a Button keeps
hover and pressed visible on every surface, including app-painted overlays, without publishing a new
colour contract.

## Problem

Low and standard Buttons painted opaque `background.neutral.subtle.hover` and `pressed` fills. Those
tokens are measured against `surface.base`. Over an app-painted overlay, or inside a role's solid
fill, hover and pressed could disappear and text contrast could fall below AA.

## Decision

One adaptive tint pair per colour mode, emitted as the private
`--luke-internal-interaction-tint-hover` and `-pressed` variables and painted as a registered
`<color>` state layer above the control fill. Light mode tints with black, dark with white.
Strengths target today's opaque subtle hover and pressed over `surface.base`. The solver chooses the
nearest pair that clears the contrast cap and visibility floors, so every gated foreground stays at
4.5:1 over every surface and subtle rest.

| Theme   | Mode  | Hover α | Pressed α | ΔE base → hover | ΔE hover → pressed |
| ------- | ----- | ------- | --------- | --------------- | ------------------ |
| Paper   | Light | 0.083   | 0.126     | 0.063           | 0.033              |
| Paper   | Dark  | 0.078   | 0.115     | 0.074           | 0.034              |
| Tactile | Light | 0.083   | 0.126     | 0.062           | 0.033              |
| Tactile | Dark  | 0.073   | 0.107     | 0.066           | 0.029              |

Residual against the opaque subtle tokens these states replace, measured over `surface.base` (OKLab
ΔE, hover / pressed): Paper light 0.000 / 0.000, Paper dark 0.006 / 0.005, Tactile light 0.000 /
0.000, Tactile dark 0.011 / 0.013. The bundled themes keep today's resting-to-hover look to within a
rounding step; Tactile dark shifts slightly more because its subtle tokens sit further from a pure
black tint.

## Solid fills

A translucent tint has almost no hover-to-pressed step over a role's solid fill: 0.006 to 0.024
across every role and bundled theme, against a 0.025 floor. A low Button inside a solid fill
therefore paints an opaque `background.<tone>.subtle.hover|pressed` chip and switches to that chip's
paired text (`text.primary`, or `foreground.danger.rest` for a critical tone), so hover and pressed
keep the opaque token step and the text stays at AA. This is a visibility fix, not a contrast fix:
the tint's contrast cap already keeps every gated foreground at 4.5:1.

## Size

The stylesheet grew 1,181 bytes gzip at level 9, from 15,081 to 16,262: the registered `@property`,
two tint declarations per mode root, and the solid-chip pairing variables. The budget in
`stylesheet-size.test.ts` is 16,480.

## Rejected

- Keeping opaque `surface.base`-relative fills. They hold only on `surface.base`.
- A public hover/pressed tint API. It would publish a new contract for one component's need.
- `color-mix()` in recipes. Theme generation could not gate its contrast.

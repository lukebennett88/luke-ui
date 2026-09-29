# Global stylesheet, reset, and cascade (#717)

Decision record for making `@luke-ui/react/stylesheet.css` the application-wide baseline and
removing `rootClassName`. Parent: epic [#709](https://github.com/lukebennett88/luke-ui/issues/709) /
issue [#717](https://github.com/lukebennett88/luke-ui/issues/717).

## Target contract (1.0)

1. One explicit static import: `@luke-ui/react/stylesheet.css`. Component imports must not inject
   CSS.
2. Theme identity class and `data-color-mode` live on `<html>`.
3. Base typography and primary text colour live on `<body>` (from the stylesheet / theme, not a
   consumer-applied `rootClassName`).
4. Structural container-query / root setup stays in the static stylesheet.
5. Nested or simultaneous theme identities/modes are out of 1.0.

## Rule-by-rule audit (`reset.css.ts` today)

Selectors today are scoped under `lukeUiClassNames.resetRoot` via `rootClassName`. For each rule,
decide what happens when that scope becomes the document (effectively `html` / descendants).

| Rule (summary)                                       | Globalise?        | Notes                                                                                                                                             |
| ---------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `box-sizing: border-box` on root + descendants       | **yes**           | Safe baseline for mixed hosts.                                                                                                                    |
| Margin reset on `blockquote, dl, dd, figure, p`      | **yes with care** | Expect apps that rely on UA margins to opt out or restyle. Document the change.                                                                   |
| Font/margin unset on headings                        | **yes with care** | Same. Luke `Heading` supplies type. Native `h*` in app chrome lose UA size.                                                                       |
| Margin/padding 0 on `ul, ol`                         | **yes with care** | Interface lists. Prose keeps typed `ol` markers via existing exemption.                                                                           |
| `list-style: none` on most lists                     | **yes**           | Keep Prose exemption.                                                                                                                             |
| Table collapse / cell padding 0                      | **yes**           | Mild. Document.                                                                                                                                   |
| Tap highlight transparent on button/select/label     | **yes**           | Mobile polish.                                                                                                                                    |
| `font: inherit` on form controls                     | **yes**           | Desired for Luke + mixed forms.                                                                                                                   |
| Transparent borderless button reset                  | **audit**         | Aggressive for native `<button>` in the host. Prefer scoping to Luke button recipe if mixed-host breakage is severe. Otherwise document strongly. |
| `color: inherit; margin: 0` on input/textarea/select | **yes**           |                                                                                                                                                   |
| Disabled `cursor: not-allowed`                       | **yes**           |                                                                                                                                                   |
| Focus-visible ring                                   | **yes**           | Keep forced-colors branch.                                                                                                                        |
| Reduced-motion kill animations/transitions           | **yes**           |                                                                                                                                                   |

Theme-root rule (`theme-root.css.ts`): accent, primary text colour, body font on the theme-root
class → move to `<body>` (or documented body selector) once identity sits on `<html>`.

## Cascade layers

Keep ordered layers: `reset`, `base`, `recipes`, `utilities` (`layer-names.ts`). Re-evaluate whether
consumer `base` remains useful after globalisation. Do not freeze an empty layer solely for history.

Unlayered application CSS still wins over layered Luke rules at equal specificity — document that
interaction for host apps.

## Migration

1. Land this audit + mixed-host test plan.
2. **Done in the global-stylesheet implementation slice:** globalise selectors, delete
   `rootClassName`, stop re-applying it on portals/overlays, update docs and samples.
3. Update installation / styling / theming MDX and settings fixture (#713 friction) as remaining
   consumers change.

## Explicit non-goals

- Nested themes/modes.
- Injecting CSS from component entrypoints.
- Preserving surprising reset effects without documentation.

## Next actions

1. Mixed-host browser regression (native headings, lists, tables, buttons, inputs + Luke controls).
2. Confirm settings fixture and packed-consumer installs need no `rootClassName` wrapper.
3. Keep identity / `:root` cleanup aligned with #715 once theme packages extract.
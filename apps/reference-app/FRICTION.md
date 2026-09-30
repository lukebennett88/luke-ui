# Reference app friction log

Consumer evidence for [#713](https://github.com/lukebennett88/luke-ui/issues/713), from the
reference app in [#723](https://github.com/lukebennett88/luke-ui/pull/723). Each finding names the
layer that met the need: high-level Luke UI, a public Luke UI primitive, React Aria Components
(RAC), or app-owned Vanilla Extract (VE).

## Needs met without a gap

| Consumer need                         | What solved it                                                                                                                                                                                                                   | Layer                 |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| App shell, sidebar, and settings rows | `Box`, `Stack`, `Cluster`, `Container`, and `ScrollFade`. `elementType` supplies landmarks. The sidebar uses `Box` because `Stack` always sets `display: flex`.                                                                  | High-level            |
| Narrow layout                         | Responsive `Box` props hide the sidebar and change padding. App-owned container-query styles stack row labels above their controls.                                                                                              | High-level, app VE    |
| Page, dialog, and row typography      | `Heading`, `Text`, and `Prose`.                                                                                                                                                                                                  | High-level            |
| Actions and route links               | `Button` for dialog and destructive actions. `Link appearance="button"` for Open settings and Back to app.                                                                                                                       | High-level            |
| Settings navigation with active state | React Router `NavLink` supplies `aria-current`. App VE styles the list. The app does not use `Box render` or `Stack render`, and nothing here needed them.                                                                       | App VE                |
| Email and navigation search inputs    | Luke UI `TextField`, including `inputRef`, `errorMessage`, `isReadOnly`, and `prefix`.                                                                                                                                           | High-level            |
| Inline profile fields beside labels   | Luke UI `TextField` always stacks the label above the input. The rows compose RAC `TextField` with `FieldLabel`, `FieldDescription`, `FieldError`, `InputGroup`, and `InputGroupInput`, which the Field primitive docs describe. | Public primitive, RAC |
| Product theme                         | `defineTheme` with a `ThemeInput`, served by a Vite plugin. Public `vars` style app-owned surfaces, borders, focus, and control chrome.                                                                                          | High-level            |
| Colour mode and text size             | `data-color-mode` on `<html>` reaches portals. The root font size scales Luke UI's rem-based type and spacing together.                                                                                                          | High-level            |
| Icons                                 | `Provider` with the documented spritesheet URL, and `Icon`.                                                                                                                                                                      | High-level            |

Saved settings, mutations, validation, drafts, upload limits, and fake persistence belong to the
app. TanStack Query, Zod, and React Router own them, and none of them need design-system support.

## Remaining gaps

### Select

- **Need:** choose a theme or text size.
- **What solved it:** RAC `Select`, `ListBox`, and `Popover`, with a RAC `Button` trigger. Luke UI
  `Icon`, `Track`, and `Text` render the options. `textRecipe` styles `SelectValue`.
- **Layer:** RAC with app VE for the trigger, list, and options.
- **Gap:** Luke UI has no public Select. The public button primitive applies Luke UI's button
  recipe, which is the wrong chrome for a select trigger, so the trigger drops to RAC.
- **Owner:** [#714: Forms and control naming](https://github.com/lukebennett88/luke-ui/issues/714)

### Switch

- **Need:** turn a boolean preference on and off, saving immediately.
- **What solved it:** RAC `SwitchField` and `SwitchButton`, named with `aria-label`. Luke UI
  `Checkbox` is the wrong affordance for a setting that saves immediately.
- **Layer:** RAC with app VE for the track, thumb, and focus ring.
- **Gap:** Luke UI has no public Switch.
- **Owner:** [#714: Forms and control naming](https://github.com/lukebennett88/luke-ui/issues/714)

### Text inside RAC control content

- **Need:** put ordinary text in a Select trigger or a Switch.
- **What solved it:** `textRecipe` on `SelectValue` in place of `Text`. `aria-label` on the switch
  in place of a `VisuallyHidden` label.
- **Layer:** high-level recipe, RAC.
- **Gap:** Luke UI `Text` and `VisuallyHidden` render RAC `Text`, which reads RAC's slotted text
  context. Inside a RAC `Select` trigger or a `SwitchField`, both throw "A slot prop is required.
  Valid slot names are "description" and "errorMessage"". RAC's opt-out is `slot={null}`, but the
  public `TextProps` type rejects `null`.
- **Owner:**
  [#711: Public composition surface](https://github.com/lukebennett88/luke-ui/issues/711), with
  [#714](https://github.com/lukebennett88/luke-ui/issues/714)

### Dialog

- **Need:** change the email address and confirm clearing saved settings.
- **What solved it:** RAC `DialogTrigger`, `ModalOverlay`, `Modal`, and `Dialog`. RAC supplies focus
  containment, dismissal, and focus restoration. `Heading`, `Text`, `TextField`, and `Button` fill
  the dialog.
- **Layer:** RAC with app VE for the overlay and surface.
- **Gap:** Luke UI has no public dialog composition.
- **Owner:** [#711: Public composition surface](https://github.com/lukebennett88/luke-ui/issues/711)

### Menu

- **Need:** change or remove the profile picture from its trigger.
- **What solved it:** RAC `MenuTrigger`, `Menu`, and `Popover`, with a RAC `Button` avatar trigger.
  A hidden native file input and image decoding handle the upload.
- **Layer:** RAC with app VE for the circular trigger and the menu.
- **Gap:** Luke UI has no public menu composition. The circular trigger and upload flow are app
  presentation, not a gap.
- **Owner:** [#711: Public composition surface](https://github.com/lukebennett88/luke-ui/issues/711)

### Root styles in portals

- **Need:** give dialogs, popovers, and menus the same reset and base typography as the app.
- **What solved it:** the app adds `rootClassName` to each RAC `ModalOverlay` and `Popover`, next to
  its own VE class.
- **Layer:** high-level (`rootClassName`), app VE.
- **Gap:** the theming guide says "Portals need nothing extra". That holds for theme variables and
  colour mode, which apply at `:root`. It does not hold for `rootClassName`, which the guide applies
  to the app shell. A body-level portal falls outside the shell and renders with browser defaults
  (serif font, default margins), so every overlay needs the class.
- **Owner:**
  [#717: Global stylesheet and cascade contract](https://github.com/lukebennett88/luke-ui/issues/717),
  documented through [#686](https://github.com/lukebennett88/luke-ui/issues/686)

### Client-side routing for links

- **Need:** Luke UI `Link` and RAC links navigate through React Router without a full page load.
- **What solved it:** RAC `RouterProvider`, with React Router's `useNavigate` and `useHref`, in the
  root layout route.
- **Layer:** RAC.
- **Gap:** no Luke UI page says how to connect `Link` to an application router. A consumer has to
  know `Link` is RAC underneath.
- **Owner:** [#720: 1.0 consumer documentation](https://github.com/lukebennett88/luke-ui/issues/720)

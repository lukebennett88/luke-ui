# Reference app friction log

Findings for [#713](https://github.com/lukebennett88/luke-ui/issues/713) from the reference app in
[#723](https://github.com/lukebennett88/luke-ui/pull/723). The app uses high-level Luke UI, public
Luke UI primitives, React Aria Components (RAC), and app-owned Vanilla Extract (VE).

## Needs met without a gap

| Consumer need                         | What solved it                                                                                                                                                                                                                             | Layer              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| App shell, sidebar, and settings rows | `Box`, `Stack`, `Cluster`, `Container`, and `ScrollFade`. `elementType` supplies landmarks. The sidebar uses `Box` because `Stack` always sets `display: flex`.                                                                            | High-level         |
| Narrow layout                         | Responsive `Box` props hide the sidebar and change padding. App-owned container-query styles stack row labels above their controls.                                                                                                        | High-level, app VE |
| Page, dialog, and row typography      | `Heading`, `Text`, and `Prose`.                                                                                                                                                                                                            | High-level         |
| Actions and route links               | `Button` for dialog and destructive actions. `Link appearance="button"` for Open settings and Back to app.                                                                                                                                 | High-level         |
| Settings navigation with active state | React Router `NavLink` supplies `aria-current`. App VE styles the list.                                                                                                                                                                    | App VE             |
| Email and navigation search inputs    | Luke UI `TextInputField`, including `inputRef`, `errorMessage`, `isReadOnly`, and `prefix`.                                                                                                                                                | High-level         |
| Inline profile fields beside labels   | Luke UI `TextInputField` always stacks the label above the input. The rows compose `TextInputRoot` with `FieldLabel`, `FieldDescription`, `FieldError`, `TextInputControl`, and `TextInput`, which the TextInput primitives docs describe. | Public primitive   |
| Product theme                         | `defineTheme` with a `ThemeInput`, served by a Vite plugin. Public `vars` style app-owned surfaces, borders, focus, and control chrome.                                                                                                    | High-level         |
| Colour mode and text size             | `data-color-mode` on `<html>` reaches portals. The root font size scales Luke UI's rem-based type and spacing together.                                                                                                                    | High-level         |
| Icons                                 | `Provider` with the documented spritesheet URL, and `Icon`.                                                                                                                                                                                | High-level         |

Saved settings, mutations, validation, drafts, upload limits, and fake persistence belong to the
app. TanStack Query, Zod, and React Router own them, and none of them need design-system support.

## Remaining gaps

### Select

Theme and text size use RAC `Select`, `ListBox`, `Popover`, and a RAC `Button` trigger. Luke UI
`Icon`, `Track`, and `Text` render the options, while `textRecipe` styles `SelectValue`. App VE
styles the trigger, list, and options. Luke UI has no public Select. Its public button primitive
applies the button recipe, which gives the select trigger the wrong chrome. The trigger therefore
uses RAC. Owner:
[#714: Forms and control naming](https://github.com/lukebennett88/luke-ui/issues/714).

### Switch

A boolean preference saves immediately when switched on or off. RAC `SwitchField` and `SwitchButton`
use `aria-label`, with app VE for the track, thumb, and focus ring. Luke UI has no public Switch,
and `Checkbox` is the wrong affordance for this setting. Owner:
[#714: Forms and control naming](https://github.com/lukebennett88/luke-ui/issues/714).

### Dialog

The dialogs for changing the email address and clearing saved settings use RAC `DialogTrigger`,
`ModalOverlay`, `Modal`, and `Dialog`. RAC supplies focus containment, dismissal, and focus
restoration. Luke UI `Heading`, `Text`, `TextInputField`, and `Button` fill the dialog, with app VE
for the overlay and surface. Luke UI has no public dialog composition. Owner:
[#711: Public composition surface](https://github.com/lukebennett88/luke-ui/issues/711).

### Menu

The profile picture menu uses RAC `MenuTrigger`, `Menu`, `Popover`, and a RAC `Button` avatar
trigger to change or remove the picture. App VE styles the circular trigger and menu. Luke UI has no
public menu composition. The circular trigger is app presentation, not a gap. Owner:
[#711: Public composition surface](https://github.com/lukebennett88/luke-ui/issues/711).

### Root styles in portals

Dialogs, popovers, and menus need the app's reset and base typography. The app adds the high-level
`rootClassName` beside its VE class on each RAC `ModalOverlay` and `Popover`. The theming guide says
"Portals need nothing extra". That applies to theme variables and colour mode at `:root`, but not to
`rootClassName`, which the guide applies to the app shell. A body-level portal falls outside that
shell and renders with browser defaults (serif font, default margins), so every overlay needs the
class. Owner:
[#717: Global stylesheet and cascade contract](https://github.com/lukebennett88/luke-ui/issues/717),
documented through [#686](https://github.com/lukebennett88/luke-ui/issues/686).

### Client-side routing for links

Luke UI `Link` and RAC links navigate through React Router without a full page load by using RAC
`RouterProvider` with React Router's `useNavigate` and `useHref` in the root layout route. No Luke
UI page explains how to connect `Link` to an application router. A consumer has to know `Link` is
RAC underneath. Owner:
[#720: 1.0 consumer documentation](https://github.com/lukebennett88/luke-ui/issues/720).

## RAC limitations

These come from RAC itself and need no Luke UI change.

### File selection from a menu item

The Change picture menu item opens a file picker. RAC `FileTrigger` cannot wrap a `MenuItem`. RAC
builds menu items in a hidden collection pass, so the `PressResponder` that `FileTrigger` provides
never reaches the rendered item. In the browser, no file chooser opens and React warns "A
PressResponder was rendered without a pressable child". A working `FileTrigger` needs a hidden
placeholder button outside the popover, an `aria-label` set on its input by hand, and an imperative
`.click()` from the menu action. That is the native input's path with more code, so the app keeps a
hidden native `<input type="file">` and clicks it from the menu action. Reading and validating the
image is app behaviour. `FileTrigger` fits when a button opens the picker directly.

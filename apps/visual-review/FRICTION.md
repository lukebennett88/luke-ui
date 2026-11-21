# Visual review friction log

Gaps found while building the visual review app with Luke UI's public entrypoints, React Aria
Components (RAC), and app-owned Vanilla Extract (VE).

## Needs met without a gap

| Need                                   | What solved it                                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| App shell and dashboard                | `Box`, `Stack`, `Cluster`, and `Container`. `elementType` supplies the landmarks.                                               |
| Bars, headers, popovers, and sheets    | `Box` with `backgroundColor`, so a low `Button` on them paints the bar's own tone.                                              |
| Typography                             | `Heading`, `Text`, and `Kbd`. Small controls use Luke UI's caption size rather than an app override.                            |
| Capture filter                         | `TextInputField` with `type="search"` and a `prefix` icon.                                                                      |
| Status filter                          | `SelectField` with `aria-label` in place of a visible label.                                                                    |
| Viewed, Hide viewed, and options       | `CheckboxField`, `SwitchField`, and `RadioGroup`, with `size="medium"` for touch on phones.                                     |
| Contents and More icons                | `createIcon`, drawn on the built-in icons' 16px grid.                                                                           |
| Client-side navigation                 | `Link` through RAC's `RouterProvider`, with no router dependency.                                                               |
| Loading states                         | `LoadingSpinner`.                                                                                                               |
| Theme                                  | `defineTheme` from `@luke-ui/react/theme/compiler`, served by a Vite plugin. Colour mode follows the system with no extra code. |
| Theme tabs, disclosures, menus, sheets | RAC `Tabs`, `Disclosure`, `Menu`, `Popover`, and `Modal`, styled in app VE with public `vars`.                                  |

## Remaining gaps

### Segmented control

The image switch (expected, actual, diff) and the fixed zoom levels are one choice among a few that
takes effect at once. The app uses RAC `ToggleButtonGroup` with app-owned VE for the neutral pressed
fill, hover, and focus outline. Luke UI has no segmented control.

### Tabs

Each example's themes are RAC `Tabs` styled in app VE. Luke UI has no tabs component, so the tab's
selected fill, focus outline, and seen marks are hand-built.

### Slider

The overlay's opacity control is RAC `Slider` with an app-owned track and thumb. Luke UI has no
slider, so the control does not share the other fields' size or label treatment.

### Menu and popover surfaces

The capture menu, View options, and Review popover are RAC `Menu`, `Popover`, `Dialog`, and `Modal`
with app-owned surface, shadow, radius, and motion. Luke UI's Select and Combobox own the same
treatment privately.

### Selectable list rows

The Contents rows are RAC buttons with `aria-current`, hover, and selected styles in app VE. The
reference app's settings navigation needs the same thing and also builds it by hand.

### Status label

The review status in the top bar and each dashboard row uses `Text` with a role colour, and an icon
for approved and changes requested. A badge would give the status a shape as well as a colour.

### Multi-line text field

A decision's note can be up to 500 characters, which suits a text area. Luke UI has only
`TextInputField`, so the note is a RAC `TextField` and `TextArea` styled in app VE to match Luke
UI's fields, with its own label, counter, and error.

### Touch-sized controls

Luke UI's `medium` controls are 40px. The phone layout gives its bottom bar buttons, difference
stepper, theme tabs, and Contents rows a 44px minimum in app VE. A larger control size would serve
any touch-first layout.

### App-only colour and size tokens

The theme has no token for a backdrop darker than every surface, so the grey stage the screenshots
sit on is an app token with light and dark values. The difference marker is a magenta stroke between
a white and a dark line. It draws over screenshots of Luke UI's own themes rather than a theme
surface, and those screenshots use the danger, warning, success, info, and accent colours for their
states, so no theme role can mark a difference without blending in. The top bar, section header, and
bottom bar heights are app tokens too. All of them live in `src/styles/app-tokens.css.ts`. "Changed
since viewed" uses the warning role's foreground.

### Accent for checked settings

Checked Viewed and option controls use the theme accent. Q drew them in neutral ink so that the
accent marked only primary actions, but a scoped neutral checkbox needs either a tone prop or a
custom property override, and the app uses neither.

### Development server and newly imported components

Importing a Luke UI component for the first time while the development server runs makes Vite
re-optimise React Aria's dependencies. The page then throws "Invalid hook call" until a reload. The
reference app avoids this by listing RAC subpaths in `optimizeDeps.include`, which a consumer has to
discover.

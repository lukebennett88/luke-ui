# Visual review friction log

Gaps found while building the visual review app with Luke UI's public entrypoints, React Aria
Components (RAC), and app-owned Vanilla Extract (VE).

## Needs met without a gap

| Need                             | What solved it                                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| App shell, header, and dashboard | `Box`, `Stack`, `Cluster`, and `Container`. `elementType` supplies the landmarks.                     |
| Typography                       | `Heading`, `Text`, and `Kbd`. `Text lineClamp` truncates long capture names.                          |
| Capture filter                   | `TextInputField` with `type="search"` and a `prefix` icon.                                            |
| Status filter and zoom           | `SelectField` with `aria-label` in place of a visible label.                                          |
| Outline toggle                   | `CheckboxField`.                                                                                      |
| Previous and next                | `IconButton` with built-in chevron icons.                                                             |
| Client-side navigation           | `Link` through RAC's `RouterProvider`, with no router dependency.                                     |
| Loading states                   | `LoadingSpinner`.                                                                                     |
| Theme                            | The Tactile stylesheet, fonts, and identity class. Colour mode follows the system with no extra code. |

## Remaining gaps

### Segmented control

The view switch (side by side, overlay, diff) is one choice among three that takes effect at once. A
horizontal `RadioGroup` is accessible and works, but it reads as a form field and takes more room
than a segmented control in a toolbar.

### Slider

The overlay's opacity control is a native `<input type="range">` styled with `accent-color` and an
app-owned focus ring. Luke UI has no slider, so the control does not match the other fields' size,
focus treatment, or label.

### Status label

Each capture and dashboard row shows a status such as "Changed" or "No visual changes". The app uses
`Text` with a role colour. A badge would give the status a shape as well as a colour.

### Selectable list rows

The capture list is a `nav` of links with `aria-current`, hover, and selected styles in app VE. The
reference app's settings navigation needs the same thing and also builds it by hand.

### A `label` rendered by `Text`

`Text elementType="label"` rejects `htmlFor`, so the opacity label is a plain `<label>` that wraps a
`Text`.

### Layout components reject visual props

`Cluster` rejects `backgroundColor`, so a toolbar row with a surface background is a `Box` with
`display="flex"` and the alignment props spelled out.

### Development server and newly imported components

Importing a Luke UI component for the first time while the development server runs makes Vite
re-optimise React Aria's dependencies. The page then throws "Invalid hook call" until a reload. The
reference app avoids this by listing RAC subpaths in `optimizeDeps.include`, which a consumer has to
discover.

# Luke UI 5

Luke UI is a React design system built with `react-aria-components` and `vanilla-extract`.

## Setup

- `pnpm install`
- `pnpm dev`: start the docs app.
- `pnpm build`: build all packages and apps.
- `pnpm check`: run lint, format, and type checks.
- `pnpm test`: run unit, Storybook, and visual regression tests.

## Stack

- **Monorepo**: pnpm + Turbo
- **React**: built on `react-aria-components`
- **Styling**: `vanilla-extract` static CSS
- **Lint/Format**: `oxlint` + `oxfmt`

## UI package (`@luke-ui/react`)

- Tokens: `src/tokens.ts`
- Theme: `src/theme/`
- Styles: `src/styles/`
- Build: `tsdown` writes `dist/stylesheet.css`

## Contributing

- Use `pnpm changeset` for version changes.
- Run `pnpm check` before committing.

## CI setup

- Argos + Storybook GitHub setup: `docs/ARGOS_SETUP.md`
- Visual regression test command: `pnpm test`

## TODO

- Revise tokens
- Make docs more visual

Components to build:

### Core

- [ ] LinkContextProvider
- [ ] ThemeContext
- [ ] ThemeProvider

### Accessibility

- [ ] LiveRegion
- [ ] SkipTo
- [ ] VisuallyHidden

### Media visuals

- [ ] Avatar
- [x] Icon
- [ ] Illustration

### Typography content

- [x] Emoji
- [x] Heading
- [x] Numeral
- [x] Text

### Feedback status indicators

- [ ] Badge
- [ ] EmptyState
- [x] LoadingSkeleton
- [ ] Notice
- [ ] ShowMore
- [ ] Toast
- [x] LoadingSpinner

### Layout structure

- [ ] Breadcrumbs
- [ ] Card
- [ ] Divider
- [ ] PageHeader
- [ ] Pagination
- [ ] ScrollWrap
- [ ] Table
- [ ] Tabs
- [ ] Tag
- [x] Link

### Actions

- [ ] ActionGroup
- [ ] ActionsDropdown
- [ ] BulkActionBar
- [x] Button
- [x] IconButton

### Forms

- [ ] AddressInput
- [ ] AllFiltersButton
- [ ] Checkbox
- [ ] DateDropdown
- [ ] DateInput
- [ ] Field
- [ ] Fieldset
- [ ] FileInput
- [ ] FilterBar
- [ ] PhoneInput
- [ ] Radio
- [ ] RichTextEditor
- [ ] SearchInput
- [ ] SelectDropdown
- [ ] SelectInput
- [ ] TextAreaInput
- [ ] TextInput
- [ ] Toggle

### Overlays

- [ ] Accordion
- [ ] Blanket
- [ ] Menu
- [ ] Modal
- [ ] Popover
- [ ] Tooltip

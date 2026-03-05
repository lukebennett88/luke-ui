# Luke UI 5

React design system using `vanilla-extract`.

## Setup

- `pnpm install`
- `pnpm dev` - Start dev
- `pnpm build` - Build all
- `pnpm check` - Lint, format, types
- `pnpm test` - Run all tests (Storybook + visual regression)

## Stack

- **Monorepo**: pnpm + Turbo
- **React**: `react-aria-components` base
- **Styling**: `vanilla-extract` (static CSS)
- **Lint/Format**: `oxlint` + `oxfmt`

## UI Package (`@luke-ui/react`)

- Tokens: `src/tokens.ts`
- Theme: `src/theme/`
- Styles: `src/styles/`
- Build: `tsdown` -> `dist/stylesheet.css`

## Contributing

- Use `pnpm changeset` for versions.
- Run `pnpm check` before committing.

## CI Setup

- Argos + Storybook GitHub setup: `docs/ARGOS_SETUP.md`
- Visual regression test command: `pnpm test`

## TODO

Components to build:

### Core

- [ ] LinkContextProvider
- [ ] ThemeContext
- [ ] ThemeProvider

### Accessibility

- [ ] LiveRegion
- [ ] SkipTo
- [ ] VisuallyHidden

### Media and visuals

- [ ] Avatar
- [x] Icon
- [ ] Illustration

### Typography and content

- [x] Emoji
- [x] Heading
- [x] Numeral
- [x] Text

### Feedback and status indicators

- [ ] Badge
- [ ] EmptyState
- [ ] LoadingSkeleton
- [ ] Notice
- [ ] ShowMore
- [ ] Toast
- [x] LoadingSpinner

### Layout and structure

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
- [x] CloseButton
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

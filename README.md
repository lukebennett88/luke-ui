# Luke UI 5

React design system using `vanilla-extract`.

## Setup

- `pnpm install`
- `pnpm dev` - Start dev
- `pnpm build` - Build all
- `pnpm check` - Lint, format, types
- `pnpm test` - Run all tests (unit, Storybook, visual regression)

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

- Chromatic + Storybook GitHub setup: `docs/CHROMATIC_SETUP.md`
- Visual regression test command: `pnpm test`

## TODO

- Revise tokens
- Review visual styles (move away from being an EDS clone)
- Make docs more visual
- Review how we do stories
  - Kitchen sink stories for Chromatic
  - Include states in Chromatic snapshots (focus, open menus etc)
  - Other examples are for consumers and quick reference

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
- [x] LoadingSkeleton
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

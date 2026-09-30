# Reference app friction log

Consumer evidence for [#713](https://github.com/lukebennett88/luke-ui/issues/713), from the settings
app in [#723](https://github.com/lukebennett88/luke-ui/pull/723).

## What worked

`Box`, `Stack`, `Cluster`, and `Container` cover the shell and settings rows. Responsive `Box` props
control the sidebar and narrow navigation. `elementType` supplies semantic landmarks. `Box render`
composes with React Router's `NavLink`, and `Stack render` lays out a native form. These
compositions need no new layout or navigation API.

`Heading` and `Text` cover page, navigation, and dialog typography. `Button` and `TextField` work
for inline profile fields and the email and clear-settings dialogs, including validation, pending
state, and keyboard submission. A public button primitive supplies behaviour for the circular
profile-picture trigger, whose presentation belongs to the app. Native file input and image decoding
handle uploads.

The public `defineTheme` API generates the product theme. Public `vars` cover app-owned surfaces,
borders, focus, and control styling. `Provider` supplies icons through the documented spritesheet
URL. Document-level colour mode reaches portals. Root font sizing makes the text-size preference
scale Luke UI's rem-based typography and spacing together.

## Remaining gaps

| Consumer need                                 | What solved it                                                                                                                                                                                                  | Remaining gap                                                                                                                                                                                                                      | Owning workstream                                                                                                                                                              |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Choose a theme or text size                   | Public button primitive and `Icon` compose with RAC `Select`, `ListBox`, and `Popover`. Public `textRecipe` styles the selected value. `Text` renders the options. App-owned VE styles the trigger and options. | Luke UI has no public Select. The app supplies the selection composition and its presentation.                                                                                                                                     | [#714: Forms and control naming](https://github.com/lukebennett88/luke-ui/issues/714)                                                                                          |
| Save boolean preferences immediately          | RAC `Switch` owns semantics and interaction. App-owned VE styles its track, thumb, and focus. Luke UI's Checkbox provides a different affordance. No public primitive was needed.                               | Luke UI has no public Switch. The app supplies its presentation.                                                                                                                                                                   | [#714: Forms and control naming](https://github.com/lukebennett88/luke-ui/issues/714)                                                                                          |
| Edit a field or confirm clearing browser data | High-level `Button`, `Heading`, `Text`, and `TextField` compose inside RAC `DialogTrigger`, `ModalOverlay`, `Modal`, and `Dialog`. App-owned VE styles the overlay and surface. No public primitive was needed. | Luke UI has no public dialog composition. RAC supplies focus containment, dismissal, and restoration.                                                                                                                              | [#711: Public composition surface](https://github.com/lukebennett88/luke-ui/issues/711)                                                                                        |
| Change or remove a profile picture            | Public button primitive with `Icon` and `Text`, RAC `MenuTrigger`, `Menu`, and `Popover`, plus app-owned VE.                                                                                                    | Luke UI has no public menu composition. RAC supplies keyboard navigation and dismissal. The circular trigger and upload workflow are app-owned.                                                                                    | [#711: Public composition surface](https://github.com/lukebennett88/luke-ui/issues/711)                                                                                        |
| Render text inside a RAC Select trigger       | Public button primitive avoids the high-level Button's internal `Text`. `SelectValue` uses the public `textRecipe`. Options use `Text`. App-owned VE supplies control chrome.                                   | Luke UI `Text` inherits RAC's Select text context in the trigger, which requires a `description` or `errorMessage` slot. Its public slot type rejects RAC's `null` opt-out. Ordinary control content crashes without a workaround. | [#711: Public composition surface](https://github.com/lukebennett88/luke-ui/issues/711), [#714: Forms and control naming](https://github.com/lukebennett88/luke-ui/issues/714) |

Zod validation, local persistence, upload limits, and local drafts remain application
responsibilities. The app's spacing, narrow row layout, and control chrome do not establish a need
for new settings-specific components.

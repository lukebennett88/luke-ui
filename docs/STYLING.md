# Styling

## Setup

Static CSS foundation. Users import `@luke-ui/react/stylesheet.css`.
Apply `themeRootClassName` (from `@luke-ui/react/theme`) to host element.

## Structure

- `tokens.ts`: Source of truth.
- `styles/vars.css.ts`: Theme variables.
- `styles/reset.css.ts`: Scoped reset (to `.luke-ui-reset`).
- `recipes/`: Shareable component recipes exported via `@luke-ui/react/recipes`.

## CSS Cascade Layers

All styles are placed in [cascade layers](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Cascade_layers) to guarantee a predictable override order regardless of source order or specificity.

| Layer       | Purpose                                                      |
| ----------- | ------------------------------------------------------------ |
| `reset`     | Normalize browser defaults (box-sizing, margins, etc.)       |
| `theme`     | Design token custom properties and base typographic defaults |
| `recipes`   | Component styles (variants, compound variants)               |
| `utilities` | One-off overrides; highest-priority escape hatch             |

Use `styleInLayer` / `recipeInLayer` / `globalStyleInLayer` from `styles/layered-style.css.ts`. These helpers prevent accidentally writing styles outside a layer.

## Recipes API

Recipes are public and can be imported from `@luke-ui/react/recipes`.

```ts
import { button, link } from '@luke-ui/react/recipes';
```

## Implementation

- Use only CSS logical properties (e.g. `margin-inline-start`, `block-size`, `inset-inline`), not physical (`margin-left`, `height`, `left`/`right`).
- Align variant names with public props (`size`, `tone`).
- Boolean props use `is*` or `should*`.

## Limitations

No Sprinkles or runtime theme context yet.

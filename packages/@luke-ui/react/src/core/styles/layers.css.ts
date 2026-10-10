import { globalLayer } from '@vanilla-extract/css';

/**
 * Luke UI's cascade layers, inside the top-level `luke-ui` layer, from lowest to highest priority:
 *
 * - **reset** — The global stylesheet: box sizing, root containment, the `<body>` baseline, scoped
 *   colour-mode repaint, form-control font, and the native focus ring.
 * - **recipes** — All component styling, including variants, compound styles, and component-owned
 *   descendant or combinator selectors.
 * - **utilities** — `Box` and the other utility props.
 *
 * The build prepends `cascadeLayerOrder` from `layer-names.ts` and strips the single-name `@layer`
 * statements these calls emit, so that statement alone sets the order.
 */
const lukeUi = globalLayer('luke-ui');

export const layers = {
	reset: globalLayer({ parent: lukeUi }, 'reset'),
	recipes: globalLayer({ parent: lukeUi }, 'recipes'),
	utilities: globalLayer({ parent: lukeUi }, 'utilities'),
};

export type LayerName = keyof typeof layers;

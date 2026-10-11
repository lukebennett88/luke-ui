import { globalLayer } from '@vanilla-extract/css';
import { lukeUiLayerNames } from './layer-names.js';

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

export type LayerName = (typeof lukeUiLayerNames)[number];

export const layers = Object.fromEntries(
	lukeUiLayerNames.map((name) => [name, globalLayer({ parent: lukeUi }, name)]),
) as Record<LayerName, string>;

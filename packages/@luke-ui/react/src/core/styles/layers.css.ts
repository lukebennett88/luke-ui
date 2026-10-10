import { globalLayer } from '@vanilla-extract/css';
import { lukeUiLayerName, lukeUiSublayerNames } from './layer-names.js';

/**
 * Luke UI's cascade layers, all inside the top-level `luke-ui` layer, from lowest to highest
 * priority:
 *
 * - **reset** — The global stylesheet: box sizing, root containment, the `<body>` baseline, scoped
 *   colour-mode repaint, form-control font, and the native focus ring.
 * - **recipes** — All component styling, including variants, compound styles, and component-owned
 *   descendant or combinator selectors.
 * - **utilities** — `Box` and the other utility props.
 *
 * The consuming application's `base` layer ranks below `luke-ui`. Luke UI declares it and never
 * writes to it. The build prepends `cascadeLayerOrder` and strips the single-name `@layer`
 * statements these calls emit, so the order statement is the only one that creates layers.
 */
const lukeUiLayer = globalLayer(lukeUiLayerName);

export const layers = Object.fromEntries(
	lukeUiSublayerNames.map((name) => [name, globalLayer({ parent: lukeUiLayer }, name)]),
) as { [Name in (typeof lukeUiSublayerNames)[number]]: ReturnType<typeof globalLayer> };

export type LayerName = keyof typeof layers;

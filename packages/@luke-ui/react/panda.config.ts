import { defineConfig } from '@pandacss/dev';
import { lukeLayerOrder } from './src/styles/layer-order.js';

// T2 ejected Panda config. Minimal box slice only; VE still owns
// reset/base/tokens/global output. See scripts/assemble-stylesheet.ts.

// Panda exposes exactly 5 fixed layer slots and has NO native `box` layer, so
// derive its `layers` object from the shared canonical order minus `box`. The
// `box` layer is produced later by re-wrapping Panda's `utilities` output.
const pandaLayerNames = lukeLayerOrder.filter((name) => name !== 'box');
// Assert the remaining five names are exactly Panda's slots, in order. If the
// shared order ever changes shape this fails loudly at config-load time.
const expectedPandaLayers = ['reset', 'base', 'tokens', 'recipes', 'utilities'] as const;
if (
	pandaLayerNames.length !== expectedPandaLayers.length ||
	pandaLayerNames.some((name, index) => name !== expectedPandaLayers[index])
) {
	throw new Error(
		`panda.config: expected layers ${expectedPandaLayers.join(', ')} but derived ${pandaLayerNames.join(', ')}`,
	);
}
const layers = {
	reset: expectedPandaLayers[0],
	base: expectedPandaLayers[1],
	tokens: expectedPandaLayers[2],
	recipes: expectedPandaLayers[3],
	utilities: expectedPandaLayers[4],
};

export default defineConfig({
	// Ejected mode: no bundled preset theme/utilities/conditions.
	eject: true,
	presets: [],

	// Harmless for the spike; nothing here is actually scanned during cssgen.
	include: ['src/**/*.{ts,tsx}'],
	exclude: [],

	outdir: 'styled-system',

	layers,

	// Minimal condition set. NO colour-mode conditions (light/dark live in a
	// separate theme generator, not as Panda conditions).
	conditions: {
		hover: '&:is(:hover, [data-hover])',
		focus: '&:is(:focus, [data-focus])',
	},

	// A few spacing tokens so the box-utility slice has real values to reference.
	theme: {
		tokens: {
			spacing: {
				none: { value: '0' },
				sm: { value: '0.5rem' },
				md: { value: '1rem' },
			},
		},
	},

	// Minimal Box-utility definitions. In ejected mode there are NO built-in
	// utilities, so these are required for `padding: "md"` to resolve to a
	// spacing token var rather than emit the literal string "md".
	utilities: {
		display: {
			className: 'display',
			values: { block: 'block', flex: 'flex' },
			transform(value) {
				return { display: value };
			},
		},
		padding: {
			className: 'padding',
			values: 'spacing',
			transform(value) {
				return { padding: value };
			},
		},
		margin: {
			className: 'margin',
			values: 'spacing',
			transform(value) {
				return { margin: value };
			},
		},
	},

	staticCss: {
		recipes: '*',
		css: [
			{
				// Minimal but real Box-utility slice: a couple of properties wired
				// to token values, enough for cssgen to emit real utility CSS.
				properties: {
					display: ['block', 'flex'],
					padding: ['none', 'sm', 'md'],
					margin: ['none', 'sm', 'md'],
				},
			},
		],
	},
});

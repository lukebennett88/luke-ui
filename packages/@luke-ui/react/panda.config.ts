import { defineConfig } from '@pandacss/dev';
import presetBase from '@pandacss/preset-base';
import { buttonComposedRecipe } from './src/recipes/button-composed.recipe.js';
import { buttonRecipe } from './src/recipes/button.recipe.js';
import { comboboxRecipe } from './src/recipes/combobox.recipe.js';
import { fieldRecipe } from './src/recipes/field.recipe.js';
import { iconButtonRecipe } from './src/recipes/icon-button.recipe.js';
import { iconRecipe } from './src/recipes/icon.recipe.js';
import { linkRecipe } from './src/recipes/link.recipe.js';
import { loadingSpinnerRecipe } from './src/recipes/loading-spinner.recipe.js';
import { textInputRecipe } from './src/recipes/text-input.recipe.js';
import { textRecipe } from './src/recipes/text.recipe.js';
import { lukeLayerOrder } from './src/styles/layer-order.js';
import { buildPandaTokens } from './src/theme/panda-tokens.js';

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

// The Panda `theme.tokens` alias layer: every semantic contract leaf as a
// `var(--luke-*)` reference. `build-theme.ts` stays the only emitter of the
// `--luke-*` values themselves.
const aliasTokens = buildPandaTokens();

export default defineConfig({
	// Ejected mode: no bundled preset theme/utilities/conditions.
	eject: true,
	presets: [],

	// Harmless for the spike; nothing here is actually scanned during cssgen.
	include: ['src/**/*.{ts,tsx}'],
	exclude: [],

	outdir: 'styled-system',
	// Emit .d.mts beside each generated .mjs so explicit `.mjs` import
	// specifiers resolve to real declarations under `module: preserve`.
	forceConsistentTypeExtension: true,
	cssVarRoot: '.luke-ui-theme',

	hooks: {
		// The generated recipe declarations import ConditionalValue from the
		// types barrel (types/index.d.mts), whose side-effect import of
		// global.d.mts reaches @pandacss/dev and, through its config types,
		// pkg-types/typescript, none of which can land in the published dts
		// bundle. ConditionalValue really lives in the self-contained
		// types/conditions.d.mts, so retarget that one import at codegen time.
		'codegen:prepare': ({ artifacts }) => {
			const barrelImport = "import type { ConditionalValue } from '../types/index.d.mts';";
			const directImport = "import type { ConditionalValue } from '../types/conditions.d.mts';";
			for (const artifact of artifacts) {
				for (const content of artifact.files) {
					if (!content.code || !content.file.endsWith('.d.mts')) continue;
					content.code = content.code.replaceAll(barrelImport, directImport);
				}
			}
			return artifacts;
		},
	},

	layers,

	// Minimal condition set. NO colour-mode conditions (light/dark live in a
	// separate theme generator, not as Panda conditions).
	conditions: {
		hover: '&:is(:hover, [data-hover])',
		focus: '&:is(:focus, [data-focus])',
	},

	// The alias layer plus the T2 box-slice placeholder spacing, kept so the box
	// `utilities`/`staticCss` below still resolve (transitional; removed later).
	theme: {
		recipes: { button: buttonRecipe, icon: iconRecipe, link: linkRecipe, text: textRecipe },
		keyframes: {
			spin: { to: { transform: 'rotate(360deg)' } },
			rubberBand: {
				'0%': { strokeDasharray: '2 100' },
				'50%': { strokeDasharray: '65 100', strokeDashoffset: -20 },
				'100%': { strokeDasharray: '2 100', strokeDashoffset: -100 },
			},
		},
		slotRecipes: {
			textInput: textInputRecipe,
			combobox: comboboxRecipe,
			field: fieldRecipe,
			loadingSpinner: loadingSpinnerRecipe,
			buttonComposed: buttonComposedRecipe,
			iconButton: iconButtonRecipe,
		},
		tokens: {
			...aliasTokens,
			spacing: {
				// T2 box-slice placeholders (transitional; removed in a later ticket).
				none: { value: '0' },
				sm: { value: '0.5rem' },
				md: { value: '1rem' },
				...aliasTokens.spacing,
			},
		},
	},

	// Bring in Panda's property utilities only. Conditions remain the two Luke
	// definitions above, so Panda does not own colour-mode or state semantics.
	utilities: presetBase.utilities,

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

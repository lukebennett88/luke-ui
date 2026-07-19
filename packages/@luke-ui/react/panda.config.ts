import { defineConfig } from '@pandacss/dev';
import presetBase from '@pandacss/preset-base';
import { buttonComposedRecipe } from './src/recipes/button-composed.recipe.js';
import { buttonRecipe } from './src/recipes/button.recipe.js';
import { comboboxRecipe } from './src/recipes/combobox.recipe.js';
import { fieldRecipe } from './src/recipes/field.recipe.js';
import { iconButtonRecipe } from './src/recipes/icon-button.recipe.js';
import { iconRecipe } from './src/recipes/icon.recipe.js';
import { linkRecipe } from './src/recipes/link.recipe.js';
import {
	loadingSkeletonGlobalCss,
	loadingSkeletonKeyframes,
	loadingSkeletonRecipe,
} from './src/recipes/loading-skeleton.recipe.js';
import { loadingSpinnerRecipe } from './src/recipes/loading-spinner.recipe.js';
import { textInputRecipe } from './src/recipes/text-input.recipe.js';
import { textRecipe } from './src/recipes/text.recipe.js';
import { responsiveBreakpoints } from './src/styles/breakpoints.js';
import { lukeLayerOrder } from './src/styles/layer-order.js';
import { buildPandaTokens, vars } from './src/theme/panda-tokens.js';

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
const staticBoxProperties = [
	'alignContent',
	'alignItems',
	'alignSelf',
	'columnGap',
	'display',
	'flexDirection',
	'flexGrow',
	'flexShrink',
	'flexWrap',
	'gap',
	'justifyContent',
	'justifySelf',
	'margin',
	'marginBlock',
	'marginBlockEnd',
	'marginBlockStart',
	'marginInline',
	'marginInlineEnd',
	'marginInlineStart',
	'overflow',
	'overflowX',
	'overflowY',
	'padding',
	'paddingBlock',
	'paddingBlockEnd',
	'paddingBlockStart',
	'paddingInline',
	'paddingInlineEnd',
	'paddingInlineStart',
	'placeSelf',
	'position',
	'rowGap',
] as const;
const spaceValues = ['none', ...Object.keys(vars.space)];
const spaceTokenValues = {
	none: '0',
	...vars.space,
};
const marginValues = ['auto', ...spaceValues];
const marginTokenValues = { auto: 'auto', ...spaceTokenValues };
const boxStaticValuesByProperty = {
	alignContent: [
		'center',
		'flex-end',
		'flex-start',
		'normal',
		'space-around',
		'space-between',
		'stretch',
	],
	alignItems: ['baseline', 'center', 'flex-end', 'flex-start', 'normal', 'stretch'],
	alignSelf: ['auto', 'baseline', 'center', 'flex-end', 'flex-start', 'normal', 'stretch'],
	columnGap: spaceValues,
	display: [
		'block',
		'contents',
		'flex',
		'grid',
		'inline',
		'inline-block',
		'inline-flex',
		'inline-grid',
		'none',
	],
	flexDirection: ['column', 'column-reverse', 'row', 'row-reverse'],
	flexGrow: ['0', '1'],
	flexShrink: ['0', '1'],
	flexWrap: ['nowrap', 'wrap', 'wrap-reverse'],
	gap: spaceValues,
	justifyContent: [
		'center',
		'flex-end',
		'flex-start',
		'normal',
		'space-around',
		'space-between',
		'space-evenly',
		'stretch',
	],
	justifySelf: ['auto', 'center', 'end', 'normal', 'start', 'stretch'],
	margin: marginValues,
	marginBlock: marginValues,
	marginBlockEnd: marginValues,
	marginBlockStart: marginValues,
	marginInline: marginValues,
	marginInlineEnd: marginValues,
	marginInlineStart: marginValues,
	overflow: ['auto', 'clip', 'hidden', 'scroll', 'visible'],
	overflowX: ['auto', 'clip', 'hidden', 'scroll', 'visible'],
	overflowY: ['auto', 'clip', 'hidden', 'scroll', 'visible'],
	padding: spaceValues,
	paddingBlock: spaceValues,
	paddingBlockEnd: spaceValues,
	paddingBlockStart: spaceValues,
	paddingInline: spaceValues,
	paddingInlineEnd: spaceValues,
	paddingInlineStart: spaceValues,
	placeSelf: ['auto', 'center', 'end', 'normal', 'start', 'stretch'],
	position: ['absolute', 'fixed', 'relative', 'static', 'sticky'],
	rowGap: spaceValues,
} as const satisfies Record<(typeof staticBoxProperties)[number], ReadonlyArray<string>>;

function boxAlias(property: string): string {
	return `box${property[0].toUpperCase()}${property.slice(1)}`;
}

function toKebabCase(value: string): string {
	return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function responsiveBoxStyle(property: string, breakpoint: string, query: string) {
	const value = `var(--box-${toKebabCase(property)}-${breakpoint})`;
	if (query === '&') return { [property]: value };

	return { [query]: { [property]: value } };
}

const boxStaticUtilities = Object.fromEntries(
	staticBoxProperties.map((property) => [
		boxAlias(property),
		{
			property,
			transform: (value: string) => ({ [property]: value }),
			values: isSpacingProperty(property)
				? spaceTokenValues
				: isMarginProperty(property)
					? marginTokenValues
					: boxStaticValuesByProperty[property],
		},
	]),
);

const boxStaticCssProperties = Object.fromEntries(
	staticBoxProperties.map((property) => [boxAlias(property), ['*']]),
);

const responsiveBoxUtilities = Object.fromEntries(
	staticBoxProperties.flatMap((property) =>
		Object.entries(responsiveBreakpoints).map(([breakpoint, { query }]) => [
			`${boxAlias(property)}${breakpoint[0].toUpperCase()}${breakpoint.slice(1)}`,
			{
				property,
				transform: () => responsiveBoxStyle(property, breakpoint, query),
				values: { dynamic: 'dynamic' },
			},
		]),
	),
);

const responsiveBoxStaticCssProperties = Object.fromEntries(
	staticBoxProperties.flatMap((property) =>
		Object.keys(responsiveBreakpoints).map((breakpoint) => [
			`${boxAlias(property)}${breakpoint[0].toUpperCase()}${breakpoint.slice(1)}`,
			['dynamic'],
		]),
	),
);

function isSpacingProperty(property: (typeof staticBoxProperties)[number]): boolean {
	return (
		property === 'columnGap' ||
		property === 'gap' ||
		property.startsWith('padding') ||
		property === 'rowGap'
	);
}

function isMarginProperty(property: (typeof staticBoxProperties)[number]): boolean {
	return property === 'margin' || property.startsWith('margin');
}
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
		xsmall: responsiveBreakpoints.xsmall.query,
		small: responsiveBreakpoints.small.query,
		medium: responsiveBreakpoints.medium.query,
		large: responsiveBreakpoints.large.query,
		xlarge: responsiveBreakpoints.xlarge.query,
		xxlarge: responsiveBreakpoints.xxlarge.query,
	},
	globalCss: loadingSkeletonGlobalCss,

	// The alias layer plus the T2 box-slice placeholder spacing, kept so the box
	// `utilities`/`staticCss` below still resolve (transitional; removed later).
	theme: {
		recipes: {
			button: buttonRecipe,
			icon: iconRecipe,
			link: linkRecipe,
			loadingSkeleton: loadingSkeletonRecipe,
			text: textRecipe,
		},
		keyframes: {
			...loadingSkeletonKeyframes,
			spin: { to: { transform: 'rotate(360deg)' } },
			rubberBand: {
				'0%': { strokeDasharray: '2 100' },
				'50%': { strokeDasharray: '65 100', strokeDashoffset: -20 },
				'100%': { strokeDasharray: '2 100', strokeDashoffset: -100 },
			},
		},
		slotRecipes: {
			buttonComposed: buttonComposedRecipe,
			combobox: comboboxRecipe,
			field: fieldRecipe,
			iconButton: iconButtonRecipe,
			loadingSpinner: loadingSpinnerRecipe,
			textInput: textInputRecipe,
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

	// Box is the only Panda utility surface. Keep this curated rather than
	// inheriting Panda's full preset so unblessed properties cannot leak into
	// the public Box API or the assembled stylesheet.
	utilities: {
		// Recipes still use Panda's base utility definitions to resolve their
		// atomics. `staticCss` below is the public emission boundary: it lists
		// only curated Box values plus these private dynamic aliases.
		...presetBase.utilities,
		...boxStaticUtilities,
		...responsiveBoxUtilities,
		boxBlockSize: {
			property: 'blockSize',
			transform: (value) => ({ blockSize: value }),
			values: { dynamic: 'var(--box-block-size)' },
		},
		boxFlex: {
			property: 'flex',
			transform: (value) => ({ flex: value }),
			values: { dynamic: 'var(--box-flex)' },
		},
		boxFlexBasis: {
			property: 'flexBasis',
			transform: (value) => ({ flexBasis: value }),
			values: { dynamic: 'var(--box-flex-basis)' },
		},
		boxGridArea: {
			property: 'gridArea',
			transform: (value) => ({ gridArea: value }),
			values: { dynamic: 'var(--box-grid-area)' },
		},
		boxGridColumn: {
			property: 'gridColumn',
			transform: (value) => ({ gridColumn: value }),
			values: { dynamic: 'var(--box-grid-column)' },
		},
		boxGridColumnEnd: {
			property: 'gridColumnEnd',
			transform: (value) => ({ gridColumnEnd: value }),
			values: { dynamic: 'var(--box-grid-column-end)' },
		},
		boxGridColumnStart: {
			property: 'gridColumnStart',
			transform: (value) => ({ gridColumnStart: value }),
			values: { dynamic: 'var(--box-grid-column-start)' },
		},
		boxGridRow: {
			property: 'gridRow',
			transform: (value) => ({ gridRow: value }),
			values: { dynamic: 'var(--box-grid-row)' },
		},
		boxGridRowEnd: {
			property: 'gridRowEnd',
			transform: (value) => ({ gridRowEnd: value }),
			values: { dynamic: 'var(--box-grid-row-end)' },
		},
		boxGridRowStart: {
			property: 'gridRowStart',
			transform: (value) => ({ gridRowStart: value }),
			values: { dynamic: 'var(--box-grid-row-start)' },
		},
		boxInlineSize: {
			property: 'inlineSize',
			transform: (value) => ({ inlineSize: value }),
			values: { dynamic: 'var(--box-inline-size)' },
		},
		boxInset: {
			property: 'inset',
			transform: (value) => ({ inset: value }),
			values: { dynamic: 'var(--box-inset)' },
		},
		boxInsetBlock: {
			property: 'insetBlock',
			transform: (value) => ({ insetBlock: value }),
			values: { dynamic: 'var(--box-inset-block)' },
		},
		boxInsetBlockEnd: {
			property: 'insetBlockEnd',
			transform: (value) => ({ insetBlockEnd: value }),
			values: { dynamic: 'var(--box-inset-block-end)' },
		},
		boxInsetBlockStart: {
			property: 'insetBlockStart',
			transform: (value) => ({ insetBlockStart: value }),
			values: { dynamic: 'var(--box-inset-block-start)' },
		},
		boxInsetInline: {
			property: 'insetInline',
			transform: (value) => ({ insetInline: value }),
			values: { dynamic: 'var(--box-inset-inline)' },
		},
		boxInsetInlineEnd: {
			property: 'insetInlineEnd',
			transform: (value) => ({ insetInlineEnd: value }),
			values: { dynamic: 'var(--box-inset-inline-end)' },
		},
		boxInsetInlineStart: {
			property: 'insetInlineStart',
			transform: (value) => ({ insetInlineStart: value }),
			values: { dynamic: 'var(--box-inset-inline-start)' },
		},
		boxMaxBlockSize: {
			property: 'maxBlockSize',
			transform: (value) => ({ maxBlockSize: value }),
			values: { dynamic: 'var(--box-max-block-size)' },
		},
		boxMaxInlineSize: {
			property: 'maxInlineSize',
			transform: (value) => ({ maxInlineSize: value }),
			values: { dynamic: 'var(--box-max-inline-size)' },
		},
		boxMinBlockSize: {
			property: 'minBlockSize',
			transform: (value) => ({ minBlockSize: value }),
			values: { dynamic: 'var(--box-min-block-size)' },
		},
		boxMinInlineSize: {
			property: 'minInlineSize',
			transform: (value) => ({ minInlineSize: value }),
			values: { dynamic: 'var(--box-min-inline-size)' },
		},
		boxOrder: {
			property: 'order',
			transform: (value) => ({ order: value }),
			values: { dynamic: 'var(--box-order)' },
		},
	},

	staticCss: {
		recipes: '*',
		css: [
			{
				conditions: ['xsmall'],
				properties: boxStaticCssProperties,
			},
			{
				properties: responsiveBoxStaticCssProperties,
			},
			{
				properties: {
					boxBlockSize: ['dynamic'],
					boxFlex: ['dynamic'],
					boxFlexBasis: ['dynamic'],
					boxGridArea: ['dynamic'],
					boxGridColumn: ['dynamic'],
					boxGridColumnEnd: ['dynamic'],
					boxGridColumnStart: ['dynamic'],
					boxGridRow: ['dynamic'],
					boxGridRowEnd: ['dynamic'],
					boxGridRowStart: ['dynamic'],
					boxInlineSize: ['dynamic'],
					boxInset: ['dynamic'],
					boxInsetBlock: ['dynamic'],
					boxInsetBlockEnd: ['dynamic'],
					boxInsetBlockStart: ['dynamic'],
					boxInsetInline: ['dynamic'],
					boxInsetInlineEnd: ['dynamic'],
					boxInsetInlineStart: ['dynamic'],
					boxMaxBlockSize: ['dynamic'],
					boxMaxInlineSize: ['dynamic'],
					boxMinBlockSize: ['dynamic'],
					boxMinInlineSize: ['dynamic'],
					boxOrder: ['dynamic'],
				},
			},
		],
	},
});

import { SEMANTIC_ROLES } from './contrast-policy.js';
import type { FontMetricStep } from './font-metric-scale.js';

/**
 * Gives all six semantic roles the same contract shape, so a role can never be added to one visual
 * slot and forgotten in another. `leaf()` builds a fresh sub-tree per role, because two roles sharing
 * one object would make them the same node.
 */
function perRole<Leaf>(leaf: () => Leaf) {
	return Object.fromEntries(SEMANTIC_ROLES.map((role) => [role, leaf()])) as {
		readonly [Role in (typeof SEMANTIC_ROLES)[number]]: Leaf;
	};
}

/** Leaves shared by every public type style. */
const typeStyle = {
	baselineTrim: null,
	capHeightTrim: null,
	fontFamily: null,
	fontSize: null,
	fontWeight: null,
	letterSpacing: null,
	lineHeight: null,
};

/**
 * The background capabilities every semantic role gets, spread once per role so the six roles cannot
 * drift apart. `rest` is an explicit leaf because a nested tree path cannot be both a string leaf
 * and the parent of `hover` and `pressed`.
 */
const roleBackground = {
	subtle: {
		rest: null,
		hover: null,
		pressed: null,
	},
	solid: {
		rest: null,
		hover: null,
		pressed: null,
	},
};

/**
 * The content capabilities every semantic role gets. `onSolid` is a single contrast-solved colour
 * for that role's solid fill, not a state ramp.
 */
const roleForeground = {
	rest: null,
	hover: null,
	pressed: null,
	onSolid: null,
};

/**
 * Public semantic type styles, in ascending visual size. Each style is a complete typography
 * treatment: family, size, weight, line height, letter spacing, and Capsize trims. Styles may share
 * private metric steps when they differ by weight rather than size.
 */
export const typeStyles = [
	'caption',
	'support',
	'label',
	'body',
	'lead',
	'heading4',
	'heading3',
	'heading2',
	'heading1',
	'display',
] as const;

/** A public semantic type style key. */
export type TypeStyle = (typeof typeStyles)[number];

/** Theme weight roles available on `vars.font.weight` and as `Text`/`Heading` overrides. */
export const fontWeightRoles = ['body', 'label', 'heading', 'emphasis'] as const;

/** A theme font-weight role key. */
export type FontWeightRole = (typeof fontWeightRoles)[number];

/**
 * Private metric step each public type style resolves from. Kept beside `typeStyles` so
 * `FONT_VALUES` emission cannot invent a different mapping.
 */
export const typeStyleMetricStep = {
	caption: 12,
	support: 14,
	label: 14,
	body: 16,
	lead: 18,
	heading4: 20,
	heading3: 24,
	heading2: 28,
	heading1: 35,
	display: 60,
} as const satisfies Record<TypeStyle, FontMetricStep>;

/**
 * Theme weight role each type style resolves to. Kept beside `typeStyles` so stylesheet emission and
 * the Text recipe cannot pick different defaults.
 */
export const typeStyleWeightRole = {
	caption: 'body',
	support: 'body',
	label: 'label',
	body: 'body',
	lead: 'body',
	heading4: 'heading',
	heading3: 'heading',
	heading2: 'heading',
	heading1: 'heading',
	display: 'heading',
} as const satisfies Record<TypeStyle, FontWeightRole>;

const fontStyleContract = Object.fromEntries(
	typeStyles.map((style) => [style, { ...typeStyle }]),
) as { readonly [Style in TypeStyle]: typeof typeStyle };

/**
 * Fixed spacing values selected from a 4px scale. Keys encode their pixel value.
 */
export const spaceScale = [
	['sp4', '4px'],
	['sp8', '8px'],
	['sp12', '12px'],
	['sp16', '16px'],
	['sp24', '24px'],
	['sp32', '32px'],
	['sp40', '40px'],
	['sp48', '48px'],
	['sp64', '64px'],
] as const;

/** A spacing step key accepted by the layout APIs. */
export type SpaceStep = (typeof spaceScale)[number][0];

const spaceContract = Object.fromEntries(spaceScale.map(([step]) => [step, null])) as {
	readonly [Step in SpaceStep]: null;
};

/**
 * The theme token tree shared by the public `vars` contract and `buildTheme`, so typed paths and
 * emitted CSS variable names can never diverge. Leaves are `null`; every path maps to one stable
 * `--luke-*` custom property.
 */
export const themeContractTree = {
	/**
	 * Semantic colours for surfaces, content, borders, and loading, plus the six shared semantic roles
	 * (`neutral`, `accent`, `info`, `success`, `warning`, `danger`).
	 *
	 * Organised by the property a token styles, not by the component that happens to use it: the
	 * functional leaves (`surface`, `overlay`, `loadingSkeleton`, `text`, and the first three `border`
	 * leaves) come first, then `background` / `foreground` / the role leaves under `border` give all
	 * six roles the same capabilities. A role's meaning never decides which visual slots it can fill,
	 * so no role is a special case here. Hover and pressed leaves are generated, not authored.
	 */
	color: {
		surface: {
			canvas: null,
			recessed: null,
			floating: null,
			overlay: null,
		},
		/** Translucent layer painted over other interface content, such as a modal backdrop. */
		overlay: {
			backdrop: null,
		},
		loadingSkeleton: null,
		text: {
			primary: null,
			secondary: null,
			/** Dedicated muted text (form fields), not opacity. Emits `--luke-color-text-disabled`. */
			disabled: null,
		},
		/** Subtle and solid background ramps, each with generated rest / hover / pressed states. */
		background: perRole(() => ({ ...roleBackground })),
		/** Resting, hover, and pressed content colours, plus the guaranteed on-solid pairing. */
		foreground: perRole(() => ({ ...roleForeground })),
		border: {
			decorative: null,
			control: null,
			focus: null,
			// The shared semantic borders. State-free on purpose: the token carries the meaning and the
			// component decides when to apply it.
			...perRole(() => null),
		},
	},
	/** Composite box-shadow values for the shared depth ladder. */
	depth: {
		recessed: null,
		resting: null,
		raised: null,
		floating: null,
		overlay: null,
	},
	/** Final background images for the shared Button and IconButton face finish. */
	actionControlFinish: {
		recessed: null,
		resting: null,
		raised: null,
	},
	/**
	 * Semantic type styles, plus the shared family and weight primitives those styles resolve from.
	 * `family` and `weight` stay public for code surfaces and weight overrides; they are not type
	 * styles themselves. The private metric scale that styles compose from is not part of this
	 * contract.
	 */
	font: {
		...fontStyleContract,
		family: {
			body: null,
			code: null,
		},
		weight: {
			body: null,
			label: null,
			heading: null,
			emphasis: null,
		},
	},
	/** Corner radii for details, controls, surfaces, overlays, and full rounding. */
	radius: {
		detail: null,
		control: null,
		surface: null,
		overlay: null,
		full: null,
	},
	/** The fixed spacing scale used by components and layout utilities. */
	space: spaceContract,
	/** Structural block sizes for small and medium controls, plus the shared minimum tap target. */
	controlSize: {
		small: null,
		medium: null,
		/** Minimum block and inline size for interactive targets, per WCAG 2.5.8. */
		minTarget: null,
		/** Square tap target for `Combobox`'s trigger and clear-button actions. */
		comboboxAction: null,
	},
	/** Interaction treatment shared by every control recipe. */
	interaction: {
		/** The fade applied to disabled and pending controls. */
		disabledOpacity: null,
	},
	/** Inline and block sizes for the four public icon sizes. */
	iconSize: {
		xsmall: null,
		small: null,
		medium: null,
		large: null,
	},
	/**
	 * Luke UI-owned durations and easing curves for interaction motion. Each duration is named for
	 * the role it plays rather than for its length, so a recipe states its intent and inherits the
	 * timing.
	 */
	motion: {
		duration: {
			/** Immediate in-place state feedback, such as hover, focus, checked, or selected. */
			feedback: null,
			/** An element or overlay that enters the interface. */
			enter: null,
			/** An element or overlay that leaves the interface. */
			exit: null,
		},
		easing: {
			/** The decelerating curve for in-place feedback and for an element that enters. */
			standard: null,
			/** The accelerating curve for an element that leaves. */
			exit: null,
		},
	},
};

/**
 * Top-level contract families that vary by colour mode. Identity families are the rest of
 * {@link themeContractTree}. This one list drives the mode-family type, {@link ModePath},
 * {@link IdentityPath}, and stylesheet partitioning.
 */
export const modeFamilies = [
	'actionControlFinish',
	'color',
	'depth',
] as const satisfies ReadonlyArray<keyof typeof themeContractTree>;

/** A top-level contract family that varies by colour mode. */
type ModeFamily = (typeof modeFamilies)[number];

/** A top-level contract family that belongs to the theme identity, not a colour mode. */
type IdentityFamily = Exclude<keyof typeof themeContractTree, ModeFamily>;

type JoinPath<Prefix extends string, Key extends string> = Prefix extends ''
	? Key
	: `${Prefix}.${Key}`;

type ContractPaths<T, Prefix extends string = ''> = {
	[K in keyof T & string]: T[K] extends null
		? JoinPath<Prefix, K>
		: ContractPaths<T[K], JoinPath<Prefix, K>>;
}[keyof T & string];

/** Dotted path of a mode-owned contract leaf, for example `'color.text.primary'`. */
export type ModePath = {
	[Family in ModeFamily]: ContractPaths<(typeof themeContractTree)[Family], Family>;
}[ModeFamily];

/** Dotted path of an identity-owned contract leaf, for example `'radius.control'`. */
export type IdentityPath = {
	[Family in IdentityFamily]: ContractPaths<(typeof themeContractTree)[Family], Family>;
}[IdentityFamily];

/** Dotted path of any contract leaf. */
export type ContractPath = IdentityPath | ModePath;

const modeFamilySet: ReadonlySet<string> = new Set(modeFamilies);

function isModeFamily(family: string): family is ModeFamily {
	return modeFamilySet.has(family);
}

function familyOf(path: string): string {
	const separator = path.indexOf('.');
	return separator === -1 ? path : path.slice(0, separator);
}

/**
 * Splits flattened contract pairs into identity and mode groups using {@link modeFamilies}.
 */
export function partitionContractPairs(pairs: ReadonlyArray<readonly [string, string]>): {
	identityPairs: Array<[IdentityPath, string]>;
	modePairs: Array<[ModePath, string]>;
} {
	const identityPairs: Array<[IdentityPath, string]> = [];
	const modePairs: Array<[ModePath, string]> = [];
	for (const [path, varName] of pairs) {
		if (isModeFamily(familyOf(path))) modePairs.push([path as ModePath, varName]);
		else identityPairs.push([path as IdentityPath, varName]);
	}
	return { identityPairs, modePairs };
}

/**
 * Flattens the theme token tree into `[path, varName]` pairs, in tree order, for example
 * `['color.background.danger.solid.hover', '--luke-color-background-danger-solid-hover']`.
 */
export function flattenThemeContract(): Array<[path: ContractPath, varName: string]> {
	const pairs: Array<[ContractPath, string]> = [];
	visitContractNode(themeContractTree, [], pairs);
	return pairs;
}

/**
 * Kebab-cases one camelCase path segment, for example `onSolid` becomes `on-solid`. Joining
 * kebab-cased segments with `-` under the `luke-` prefix yields the CSS variable name.
 */
function kebabCaseSegment(segment: string): string {
	return segment.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function visitContractNode(
	node: Record<string, unknown>,
	segments: Array<string>,
	pairs: Array<[ContractPath, string]>,
): void {
	for (const [key, value] of Object.entries(node)) {
		const path = [...segments, key];
		if (value === null) {
			pairs.push([path.join('.') as ContractPath, themeVarName(path)]);
			continue;
		}
		if (!isContractNode(value)) {
			throw new Error(`Theme contract node "${path.join('.')}" must be an object or null`);
		}
		visitContractNode(value, path, pairs);
	}
}

function isContractNode(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Builds the stable `--luke-*` CSS variable name for a contract path's segments, for example
 * `['color', 'foreground', 'danger', 'onSolid']` becomes `--luke-color-foreground-danger-on-solid`.
 */
export function themeVarName(segments: Array<string>): string {
	return `--luke-${segments.map(kebabCaseSegment).join('-')}`;
}

import { typedEntries } from '../shared/utils/utils.js';
import { SEMANTIC_ROLES } from './contrast-policy.js';
import { literalScale } from './literal-scale.js';
import type { TypeStyle } from './type-styles.js';
import { typeStyles } from './type-styles.js';

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

/**
 * Leaves shared by every public type style. The font-dependent Capsize trims are not public; see
 * `capsize-trim-vars.ts`.
 */
const typeStyle = {
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
 * The content capabilities every semantic role gets. Both on-solid hierarchy leaves are
 * contrast-solved for that role's solid rest, hover, and pressed fills. They may share a colour.
 */
const roleForeground = {
	rest: null,
	hover: null,
	pressed: null,
	onSolid: {
		primary: null,
		secondary: null,
	},
};

const fontStyleContract = Object.fromEntries(
	typeStyles.map((style) => [style, { ...typeStyle }]),
) as { readonly [Style in TypeStyle]: typeof typeStyle };

/** Fixed spacing measurements. Numeric keys and rem values derive from the same steps. */
export const spaceScale = literalScale('', [4, 8, 12, 16, 24, 32, 40, 48, 64, 96] as const);

/** Numeric key in the spacing variable contract. */
export type SpaceStep = keyof typeof spaceScale;

const spaceContract: Record<string, null> = {};
for (const [step] of typedEntries(spaceScale)) {
	spaceContract[step] = null;
}

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
	 * functional leaves (`surface`, `overlay`, `loadingSkeleton`, `text`, and the first four `border`
	 * leaves) come first, then `background` / `foreground` / the role leaves under `border` give all
	 * six roles the same capabilities. A role's meaning never decides which visual slots it can fill,
	 * so no role is a special case here. Hover and pressed leaves are generated, not authored.
	 */
	color: {
		/** The four surfaces content sits on. */
		surface: {
			/** The application background and primary content. */
			base: null,
			/** Secondary regions, such as a sidebar or an inline code chip. */
			subdued: null,
			/** Form-control surfaces. */
			field: null,
			/** Detached content, such as menus, popovers, and dialogs. */
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
			/** A subtle separator. Not contrast-checked. */
			decorative: null,
			/** The guaranteed 3:1 boundary of a control against every surface. */
			control: null,
			/** The hovered control boundary, with the same 3:1 guarantee as `control`. */
			controlHover: null,
			focus: null,
			// The shared semantic borders. State-free on purpose: the token carries the meaning and the
			// component decides when to apply it. Decorative tints: they carry no contrast guarantee.
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
	/** Final background images for the face of a solid control fill, such as a solid Button. */
	controlFinish: {
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
			display: null,
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
	space: spaceContract as { readonly [Step in SpaceStep]: null },
	/** Structural block sizes for `px32` and `px40` controls. */
	controlSize: {
		px32: null,
		px40: null,
	},
	/** Interaction treatment shared by every control recipe. */
	interaction: {
		/** The fade applied to disabled and pending controls. */
		disabledOpacity: null,
	},
	/**
	 * Luke UI-owned motion treatments for interaction. Each treatment pairs a duration with its
	 * easing, so a recipe selects feedback, enter, or exit and inherits both timing axes.
	 */
	motion: {
		/** Immediate in-place state feedback, such as hover, focus, checked, or selected. */
		feedback: {
			duration: null,
			easing: null,
		},
		/** An element or overlay that enters the interface. */
		enter: {
			duration: null,
			easing: null,
		},
		/** An element or overlay that leaves the interface. */
		exit: {
			duration: null,
			easing: null,
		},
	},
};

/**
 * Top-level contract families that vary by colour mode. Identity families are the rest of
 * {@link themeContractTree}. This one list drives the mode-family type, {@link ModePath},
 * {@link IdentityPath}, and stylesheet partitioning.
 */
export const modeFamilies = ['color', 'controlFinish', 'depth'] as const satisfies ReadonlyArray<
	keyof typeof themeContractTree
>;

/** A top-level contract family that varies by colour mode. */
type ModeFamily = (typeof modeFamilies)[number];

const CAMEL_BOUNDARY_PATTERN = /([a-z0-9])([A-Z])/g;

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
	return segment.replace(CAMEL_BOUNDARY_PATTERN, '$1-$2').toLowerCase();
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
 * `['color', 'foreground', 'danger', 'onSolid', 'primary']` becomes
 * `--luke-color-foreground-danger-on-solid-primary`.
 */
export function themeVarName(segments: Array<string>): string {
	return `--luke-${segments.map(kebabCaseSegment).join('-')}`;
}

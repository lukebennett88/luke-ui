const fontStep = {
	baselineTrim: null,
	capHeightTrim: null,
	fontSize: null,
	letterSpacing: null,
	lineHeight: null,
};

/**
 * The background capabilities every semantic role gets, spread once per role so the six roles cannot
 * drift apart. `rest` is an explicit leaf because a nested tree path cannot be both a string leaf and
 * the parent of `hover` and `pressed`.
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
 * The content capabilities every semantic role gets. There is no `pressed` foreground: press is
 * carried by the background ramp and non-colour cues, so text and icons reuse `hover`.
 */
const roleForeground = {
	rest: null,
	hover: null,
	onSolid: null,
};

/** Source-owned typography size step keys, in display order. */
export const fontSizeSteps = [
	'100',
	'200',
	'300',
	'400',
	'500',
	'600',
	'700',
	'800',
	'900',
] as const;

/** A typography size step key. */
export type FontSizeStep = (typeof fontSizeSteps)[number];

/**
 * The fixed spacing steps shared by the built-in themes. Each value is a selected step from the
 * 4px linear scale.
 */
export const spaceScale = [
	['100', '4px'],
	['200', '8px'],
	['300', '12px'],
	['400', '16px'],
	['600', '24px'],
	['800', '32px'],
	['1000', '40px'],
	['1200', '48px'],
	['1600', '64px'],
] as const;

/** A spacing step key accepted by the layout APIs. */
export type SpaceStep = (typeof spaceScale)[number][0];

const spaceContract = Object.fromEntries(spaceScale.map(([step]) => [step, null])) as {
	readonly [Step in SpaceStep]: null;
};

/**
 * The semantic token tree shared by the public `vars` contract and `buildTheme`, so typed paths and
 * emitted CSS variable names can never diverge. Leaves are `null`; every path maps to one stable
 * `--luke-*` custom property.
 */
export const themeContractTree = {
	/**
	 * Semantic colours for surfaces, content, borders, and loading, plus the six shared semantic roles
	 * (`neutral`, `accent`, `info`, `success`, `warning`, `danger`).
	 *
	 * Organised by the property a token styles, not by the component that happens to use it: the
	 * functional leaves (`surface`, `scrim`, `loadingSkeleton`, `text`, and the first three `border`
	 * leaves) come first, then `background` / `foreground` / the role leaves under `border` give all
	 * six roles the same capabilities. A role's meaning never decides which visual slots it can fill,
	 * so no role is a special case here.
	 */
	color: {
		surface: {
			canvas: null,
			recessed: null,
			floating: null,
			overlay: null,
		},
		/** Modal-backdrop dimming layer behind an overlay surface. */
		scrim: null,
		loadingSkeleton: null,
		text: {
			primary: null,
			secondary: null,
			/** Dedicated muted text (form fields), not opacity. Emits `--luke-color-text-disabled`. */
			disabled: null,
		},
		/** Subtle and solid background ramps, each with the shared rest / hover / pressed states. */
		background: {
			neutral: { ...roleBackground },
			accent: { ...roleBackground },
			info: { ...roleBackground },
			success: { ...roleBackground },
			warning: { ...roleBackground },
			danger: { ...roleBackground },
		},
		/** Resting and stronger interactive content colours, plus the guaranteed on-solid pairing. */
		foreground: {
			neutral: { ...roleForeground },
			accent: { ...roleForeground },
			info: { ...roleForeground },
			success: { ...roleForeground },
			warning: { ...roleForeground },
			danger: { ...roleForeground },
		},
		border: {
			decorative: null,
			control: null,
			focus: null,
			// The shared semantic borders. State-free on purpose: the token carries the meaning and the
			// component decides when to apply it.
			neutral: null,
			accent: null,
			info: null,
			success: null,
			warning: null,
			danger: null,
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
	/** Composite type steps, font families, and theme-controlled weight roles. */
	font: {
		100: {
			...fontStep,
		},
		200: {
			...fontStep,
		},
		300: {
			...fontStep,
		},
		400: {
			...fontStep,
		},
		500: {
			...fontStep,
		},
		600: {
			...fontStep,
		},
		700: {
			...fontStep,
		},
		800: {
			...fontStep,
		},
		900: {
			...fontStep,
		},
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
	/** The semantic spacing scale used by components and layout utilities. */
	space: spaceContract,
	/** Structural block sizes for small and medium controls. */
	controlSize: {
		small: null,
		medium: null,
	},
	/** Inline and block sizes for the four public icon sizes. */
	iconSize: {
		xsmall: null,
		small: null,
		medium: null,
		large: null,
	},
	/** Luke UI-owned durations and easing curves for interaction motion. */
	motion: {
		duration: {
			fast: null,
		},
		easing: {
			standard: null,
			exit: null,
		},
	},
};

/**
 * Flattens the semantic token tree into `[path, varName]` pairs, in tree order, for example
 * `['color.background.danger.solid.hover', '--luke-color-background-danger-solid-hover']`.
 */
export function flattenThemeContract(): Array<[path: string, varName: string]> {
	const pairs: Array<[string, string]> = [];
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
	pairs: Array<[string, string]>,
): void {
	for (const [key, value] of Object.entries(node)) {
		const path = [...segments, key];
		if (value === null) {
			pairs.push([path.join('.'), themeVarName(path)]);
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

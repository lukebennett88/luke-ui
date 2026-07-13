/**
 * The semantic token tree shared by the vanilla-extract contract and `buildTheme`, so typed paths
 * and emitted CSS variable names can never diverge. Leaves are `null`; every path maps to one
 * stable `--luke-*` custom property.
 */
export const themeContractTree = {
	color: {
		surface: { canvas: null, resting: null, recessed: null, floating: null, overlay: null },
		surfaceDisabled: null,
		text: { primary: null, secondary: null },
		textDisabled: null,
		border: { decorative: null, control: null, focus: null },
		borderDisabled: null,
		intent: {
			neutral: {
				surface: {
					subtle: null,
					subtleHover: null,
					subtlePressed: null,
					solid: null,
					solidHover: null,
					solidPressed: null,
				},
				onSolid: null,
			},
			accent: {
				surface: {
					subtle: null,
					subtleHover: null,
					subtlePressed: null,
					solid: null,
					solidHover: null,
					solidPressed: null,
				},
				border: null,
				text: null,
				textHover: null,
				onSolid: null,
			},
			info: {
				surface: {
					subtle: null,
					subtleHover: null,
					subtlePressed: null,
					solid: null,
					solidHover: null,
					solidPressed: null,
				},
				border: null,
				text: null,
				onSolid: null,
			},
			success: {
				surface: {
					subtle: null,
					subtleHover: null,
					subtlePressed: null,
					solid: null,
					solidHover: null,
					solidPressed: null,
				},
				border: null,
				text: null,
				onSolid: null,
			},
			warning: {
				surface: {
					subtle: null,
					subtleHover: null,
					subtlePressed: null,
					solid: null,
					solidHover: null,
					solidPressed: null,
				},
				border: null,
				text: null,
				onSolid: null,
			},
			danger: {
				surface: {
					subtle: null,
					subtleHover: null,
					subtlePressed: null,
					solid: null,
					solidHover: null,
					solidPressed: null,
				},
				border: null,
				text: null,
				onSolid: null,
			},
		},
	},
	depth: { recessed: null, resting: null, raised: null, floating: null, overlay: null },
	font: {
		100: { fontSize: null, letterSpacing: null, lineHeight: null },
		200: { fontSize: null, letterSpacing: null, lineHeight: null },
		300: { fontSize: null, letterSpacing: null, lineHeight: null },
		400: { fontSize: null, letterSpacing: null, lineHeight: null },
		500: { fontSize: null, letterSpacing: null, lineHeight: null },
		600: { fontSize: null, letterSpacing: null, lineHeight: null },
		700: { fontSize: null, letterSpacing: null, lineHeight: null },
		800: { fontSize: null, letterSpacing: null, lineHeight: null },
		900: { fontSize: null, letterSpacing: null, lineHeight: null },
		family: null,
		weight: { body: null, label: null, heading: null, emphasis: null },
	},
	radius: { detail: null, control: null, surface: null, overlay: null, full: null },
	space: {
		100: null,
		200: null,
		300: null,
		400: null,
		600: null,
		800: null,
		1000: null,
		1200: null,
		1600: null,
	},
	controlSize: { small: null, medium: null },
	iconSize: { xsmall: null, small: null, medium: null, large: null },
	motion: {
		duration: { fast: null, medium: null, slow: null, ambient: null },
		easing: { standard: null, enter: null, exit: null },
	},
};

/**
 * Flattens the semantic token tree into `[path, varName]` pairs, in tree order, for example
 * `['color.intent.danger.surface.solidHover', '--luke-color-intent-danger-surface-solid-hover']`.
 */
export function flattenThemeContract(): Array<[path: string, varName: string]> {
	const pairs: Array<[string, string]> = [];
	visitContractNode(themeContractTree, [], pairs);
	return pairs;
}

/**
 * Kebab-cases one camelCase path segment, for example `solidHover` becomes `solid-hover`. Joining
 * kebab-cased segments with `-` under the `luke-` prefix yields the CSS variable name.
 */
export function kebabCaseSegment(segment: string): string {
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

function themeVarName(segments: Array<string>): string {
	return `--luke-${segments.map(kebabCaseSegment).join('-')}`;
}

import { vars } from '../../theme/contract.css.js';
import type { SEMANTIC_ROLES } from '../../theme/contrast-policy.js';

type SemanticRole = (typeof SEMANTIC_ROLES)[number];
type InteractionState = 'rest' | 'hover' | 'pressed';

/** The readable primary and secondary colours, and one readable colour per semantic role. */
type ForegroundSlot = 'primary' | 'secondary' | SemanticRole;

/**
 * A recognised opaque background: a standard surface, or a role's subtle or solid fill in one of
 * its interaction states.
 */
export type SurfaceBackground =
	| `surface.${keyof typeof vars.color.surface}`
	| `${SemanticRole}.${'subtle' | 'solid'}.${'rest' | 'hover' | 'pressed'}`;

// The foreground a solid fill sets for its descendants. Standard surfaces and subtle fills use the
// global neutral hierarchy and keep each role's resting hue, so they reset these overrides and every
// read falls back to the theme token on the reading element. The names are stable, like the Capsize
// trims, so tests that load the built stylesheet can read them.
const primaryOverride = '--luke-internal-foreground-primary';
const secondaryOverride = '--luke-internal-foreground-secondary';
const toneOverride = '--luke-internal-foreground-tone';

/**
 * The colour the nearest recognised surface establishes for `slot`. On a standard surface or any
 * subtle fill, the global neutral hierarchy and the role's hue in `state`. On a solid fill, that
 * role's on-solid leaves, with every semantic role in every state resolving to on-solid primary.
 *
 * `state` applies to the semantic roles, for an interactive foreground such as a text action's
 * hover colour. The compiler gates every role's states against every subtle fill, so each stays
 * readable. Primary and secondary have no states.
 */
export function contextualForeground(
	slot: ForegroundSlot,
	state: InteractionState = 'rest',
): string {
	if (slot === 'primary') return `var(${primaryOverride}, ${vars.color.text.primary})`;
	if (slot === 'secondary') return `var(${secondaryOverride}, ${vars.color.text.secondary})`;
	return `var(${toneOverride}, ${vars.color.foreground[slot][state]})`;
}

/**
 * The colour of disabled text that sits on whatever surface surrounds it, such as a field label.
 * On a standard surface or any subtle fill, the theme's disabled token. On a solid fill, which has
 * no disabled leaf, the fill's on-solid secondary, so the text stays readable and the control's own
 * disabled treatment carries the state.
 */
export function contextualDisabledForeground(): string {
	return `var(${secondaryOverride}, ${vars.color.text.disabled})`;
}

/**
 * Pairs a recognised background with its foreground context and sets `color` to contextual
 * primary, so the painted element and everything that inherits from it read correctly. Spread it
 * into any style rule, condition, or state selector that changes the background, and never set the
 * background without it.
 *
 * A solid fill's overrides resolve on the element that declares them, then inherit as colours. A
 * colour-mode scope must declare the neutral context again, or it would inherit the outer mode's
 * colours.
 */
export function surfaceStyle(background: SurfaceBackground): {
	backgroundColor: string;
	color: string;
	vars: Record<string, string>;
} {
	const [group, level, state] = background.split('.') as [string, string, string | undefined];
	if (group === 'surface') {
		return neutralContext(vars.color.surface[level as keyof typeof vars.color.surface]);
	}

	const role = group as SemanticRole;
	const prominence = level as 'subtle' | 'solid';
	const backgroundColor =
		vars.color.background[role][prominence][state as 'rest' | 'hover' | 'pressed'];
	if (prominence === 'subtle') return neutralContext(backgroundColor);

	const { onSolid } = vars.color.foreground[role];
	return {
		backgroundColor,
		color: onSolid.primary,
		vars: {
			[primaryOverride]: onSolid.primary,
			[secondaryOverride]: onSolid.secondary,
			[toneOverride]: onSolid.primary,
		},
	};
}

/**
 * Undoes `surfaceStyle` on an element that stops painting a fill in some state, such as inline code
 * inside a code block. The element turns transparent and takes its parent's colour and foreground
 * context again.
 */
export function transparentSurfaceStyle(): {
	backgroundColor: string;
	color: string;
	vars: Record<string, string>;
} {
	return {
		backgroundColor: 'transparent',
		color: 'inherit',
		vars: {
			[primaryOverride]: 'inherit',
			[secondaryOverride]: 'inherit',
			[toneOverride]: 'inherit',
		},
	};
}

function neutralContext(backgroundColor: string) {
	return {
		backgroundColor,
		color: vars.color.text.primary,
		vars: {
			[primaryOverride]: 'initial',
			[secondaryOverride]: 'initial',
			[toneOverride]: 'initial',
		},
	};
}

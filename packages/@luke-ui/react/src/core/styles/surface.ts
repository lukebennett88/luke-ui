import { createGlobalVar, fallbackVar } from '@vanilla-extract/css';
import { typedEntries } from '../../shared/utils/utils.js';
import { vars } from '../../theme/contract.css.js';
import { SEMANTIC_ROLES } from '../../theme/contrast-policy.js';

type SemanticRole = (typeof SEMANTIC_ROLES)[number];

/** The readable primary and secondary colours, and one readable colour per semantic role. */
type ForegroundSlot = 'primary' | 'secondary' | SemanticRole;

const INTERACTION_STATES = ['rest', 'hover', 'pressed'] as const;

/**
 * A recognised opaque background: a standard surface, or a role's subtle or solid fill in one of
 * its interaction states.
 */
export type SurfaceBackground =
	| `surface.${keyof typeof vars.color.surface}`
	| `${SemanticRole}.${'subtle' | 'solid'}.${(typeof INTERACTION_STATES)[number]}`;

type SurfaceStyle = {
	backgroundColor: string;
	color: string;
	vars: Record<string, string>;
};

// The foreground a solid fill sets for its descendants. Standard surfaces and subtle fills use the
// global neutral hierarchy and keep each role's resting hue, so they reset these overrides and every
// read falls back to the theme token on the reading element. The names are global rather than
// hashed, like the Capsize trims, so tests that load the built stylesheet can read them.
const foregroundOverride = {
	primary: createGlobalVar('luke-internal-foreground-primary'),
	secondary: createGlobalVar('luke-internal-foreground-secondary'),
	tone: createGlobalVar('luke-internal-foreground-tone'),
};

/**
 * The colour the nearest recognised surface establishes for `slot`. On a standard surface or any
 * subtle fill, the global neutral hierarchy and the role's resting hue. On a solid fill, that
 * role's on-solid leaves, with every semantic role resolving to on-solid primary.
 */
export function contextualForeground(slot: ForegroundSlot): string {
	if (slot === 'primary') return fallbackVar(foregroundOverride.primary, vars.color.text.primary);
	if (slot === 'secondary') {
		return fallbackVar(foregroundOverride.secondary, vars.color.text.secondary);
	}
	return fallbackVar(foregroundOverride.tone, vars.color.foreground[slot].rest);
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
export function surfaceStyle(background: SurfaceBackground): SurfaceStyle {
	const pairing = surfaceStyles.get(background);
	if (!pairing) throw new Error(`No foreground pairing for the ${background} background.`);
	return pairing;
}

function neutralContext(backgroundColor: string): SurfaceStyle {
	return {
		backgroundColor,
		color: vars.color.text.primary,
		vars: {
			[foregroundOverride.primary]: 'initial',
			[foregroundOverride.secondary]: 'initial',
			[foregroundOverride.tone]: 'initial',
		},
	};
}

function solidContext(role: SemanticRole, backgroundColor: string): SurfaceStyle {
	const { onSolid } = vars.color.foreground[role];
	return {
		backgroundColor,
		color: onSolid.primary,
		vars: {
			[foregroundOverride.primary]: onSolid.primary,
			[foregroundOverride.secondary]: onSolid.secondary,
			[foregroundOverride.tone]: onSolid.primary,
		},
	};
}

const surfaceStyles = new Map<SurfaceBackground, SurfaceStyle>();
for (const [surface, backgroundColor] of typedEntries(vars.color.surface)) {
	surfaceStyles.set(`surface.${surface}`, neutralContext(backgroundColor));
}
for (const role of SEMANTIC_ROLES) {
	const { subtle, solid } = vars.color.background[role];
	for (const state of INTERACTION_STATES) {
		surfaceStyles.set(`${role}.subtle.${state}`, neutralContext(subtle[state]));
		surfaceStyles.set(`${role}.solid.${state}`, solidContext(role, solid[state]));
	}
}

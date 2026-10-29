import { createGlobalVar, fallbackVar } from '@vanilla-extract/css';
import { typedEntries } from '../../shared/utils/utils.js';
import { vars } from '../../theme/contract.css.js';
import { SEMANTIC_ROLES } from '../../theme/contrast-policy.js';
import {
	solidStateFillVarName,
	solidStateGeneratedFillVarName,
	solidStateGeneratedTextVarName,
	solidStateTextVarName,
} from '../../theme/interaction-tint-vars.js';
import type { SolidStateTone } from '../../theme/interaction-tint-vars.js';

type SemanticRole = (typeof SEMANTIC_ROLES)[number];

/** The readable primary and secondary colours, and one readable colour per semantic role. */
type ForegroundSlot = 'primary' | 'secondary' | SemanticRole;

const SOLID_STATES = ['rest', 'hover', 'pressed'] as const;
type SolidInteractionState = (typeof SOLID_STATES)[number];
type InteractionState = SolidInteractionState;

/**
 * A recognised opaque background: a standard surface, or a role's subtle or solid fill in one of
 * its interaction states.
 */
export type SurfaceBackground =
	| `surface.${keyof typeof vars.color.background.surface}`
	| `${SemanticRole}.subtle`
	| `${SemanticRole}.solid.${SolidInteractionState}`;

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

// The ring colour a container's fill establishes for the focusable controls inside it. Only
// containers declare it, never a control that paints its own fill, because a control's ring is
// adjacent to the surface around it, not to its own fill.
const focusOverride = createGlobalVar('luke-internal-focus');

// What a container's own rule offers its children as their ring context. The container sets it in
// the same rule, and so under the same responsive condition, as its fill. A `> *` rule copies it
// onto the children without a condition of its own, because a container query on a child resolves
// against a different ancestor than the one on the container.
const focusChildren = createGlobalVar('luke-internal-focus-children');

function solidStateVars(
	value: (tone: SolidStateTone, slot: 'hover' | 'pressed' | 'text') => string,
) {
	return {
		[solidStateFillVarName('neutral', 'hover')]: value('neutral', 'hover'),
		[solidStateFillVarName('neutral', 'pressed')]: value('neutral', 'pressed'),
		[solidStateTextVarName('neutral')]: value('neutral', 'text'),
		[solidStateFillVarName('danger', 'hover')]: value('danger', 'hover'),
		[solidStateFillVarName('danger', 'pressed')]: value('danger', 'pressed'),
		[solidStateTextVarName('danger')]: value('danger', 'text'),
	};
}

/**
 * The colour the nearest recognised surface establishes for `slot`. On a standard surface or any
 * subtle fill, the global neutral hierarchy and the role's hue in `state`. On a solid fill, that
 * role's on-solid colour, with every semantic role in every state resolving to on-solid.
 *
 * `state` applies to the semantic roles, for an interactive foreground such as a text action's
 * hover colour. The compiler gates every role's states against every subtle fill, so each stays
 * readable. Primary and secondary have no states.
 */
export function contextualForeground(
	slot: ForegroundSlot,
	state: InteractionState = 'rest',
): string {
	if (slot === 'primary')
		return fallbackVar(foregroundOverride.primary, vars.color.foreground.primary);
	if (slot === 'secondary') {
		return fallbackVar(foregroundOverride.secondary, vars.color.foreground.secondary);
	}
	return fallbackVar(foregroundOverride.tone, vars.color.foreground[slot][state]);
}

/**
 * The focus ring colour for the nearest container. On a standard surface or any subtle fill, the
 * literal `vars.color.focus`, which is gated against those backgrounds. On a solid fill, that role's
 * on-solid colour, because no single focus colour can clear both the page and every solid.
 */
export function contextualFocus(): string {
	return fallbackVar(focusOverride, vars.color.focus);
}

function focusContextValue(background: SurfaceBackground): string {
	const role = SEMANTIC_ROLES.find((candidate) => background.startsWith(`${candidate}.solid`));
	return role === undefined ? 'initial' : vars.color.foreground[role].onSolid;
}

/**
 * The ring colour a container's fill offers its children: inside a solid, that role's on-solid
 * colour. Declare it in the same rule as the fill, so both follow the same responsive condition,
 * and pair it with `childFocusContextVars()` on the container's children. Never apply the context
 * to the container itself, whose own ring is adjacent to the surface around it. A control that
 * paints its own fill offers none.
 */
export function containerFocusContextVars(background: SurfaceBackground) {
	return { [focusChildren]: focusContextValue(background) };
}

/** Takes the ring context the parent container offers. Apply it to a container's children. */
export function childFocusContextVars() {
	return { [focusOverride]: focusChildren };
}

/**
 * The ring context for a child that is itself a container. It declares its own offer, which hides
 * its parent's from `childFocusContextVars()`, so it takes the parent's colour directly. Apply it
 * under the parent's fill condition.
 */
export function nestedContainerFocusContextVars(background: SurfaceBackground) {
	return { [focusOverride]: focusContextValue(background) };
}

/**
 * Resets the focus ring context on an element whose ring sits on a neutral fill: the children of a
 * colour-mode scope, or a button inside a control that paints its own base fill.
 */
export function neutralFocusContextVars() {
	return { [focusOverride]: 'initial' };
}

/**
 * The colour of disabled text that sits on whatever surface surrounds it, such as a field label.
 * On a standard surface or any subtle fill, the theme's disabled token. On a solid fill, which has
 * no disabled leaf, the fill's on-solid, so the text stays readable and the control's own
 * disabled treatment carries the state.
 */
export function contextualDisabledForeground(): string {
	return fallbackVar(foregroundOverride.secondary, vars.color.foreground.disabled);
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

/**
 * Undoes `surfaceStyle` on an element that stops painting a fill in some state, such as inline code
 * inside a code block. The element turns transparent and takes its parent's colour and foreground
 * context again.
 */
export function transparentSurfaceStyle(): SurfaceStyle {
	return {
		backgroundColor: 'transparent',
		color: 'inherit',
		vars: {
			[foregroundOverride.primary]: 'inherit',
			[foregroundOverride.secondary]: 'inherit',
			[foregroundOverride.tone]: 'inherit',
		},
	};
}

function neutralContext(backgroundColor: string): SurfaceStyle {
	return {
		backgroundColor,
		color: vars.color.foreground.primary,
		vars: {
			...neutralForegroundContextVars(),
			...solidStateVars(() => 'initial'),
		},
	};
}

/** Resets solid foreground overrides so descendants read the neutral text and role tokens. */
export function neutralForegroundContextVars() {
	return {
		[foregroundOverride.primary]: 'initial',
		[foregroundOverride.secondary]: 'initial',
		[foregroundOverride.tone]: 'initial',
	};
}

function solidContext(role: SemanticRole, backgroundColor: string): SurfaceStyle {
	const { onSolid } = vars.color.foreground[role];
	return {
		backgroundColor,
		color: onSolid,
		vars: {
			...solidStateVars((tone, slot) => {
				if (slot === 'text') return `var(${solidStateGeneratedTextVarName(tone)})`;
				return `var(${solidStateGeneratedFillVarName(tone, slot)})`;
			}),
			[foregroundOverride.primary]: onSolid,
			[foregroundOverride.secondary]: onSolid,
			[foregroundOverride.tone]: onSolid,
		},
	};
}

const surfaceStyles = new Map<SurfaceBackground, SurfaceStyle>();
for (const [surface, backgroundColor] of typedEntries(vars.color.background.surface)) {
	surfaceStyles.set(`surface.${surface}`, neutralContext(backgroundColor));
}
for (const role of SEMANTIC_ROLES) {
	const { subtle, solid } = vars.color.background[role];
	surfaceStyles.set(`${role}.subtle`, neutralContext(subtle));
	for (const state of SOLID_STATES) {
		surfaceStyles.set(`${role}.solid.${state}`, solidContext(role, solid[state]));
	}
}

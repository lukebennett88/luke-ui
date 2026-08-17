/**
 * The one default semantic colour mapping. `mapSemanticColors` aliases every generated colour
 * contract leaf onto a private scale family's step, a generated surface, or a generated interaction
 * state. Resting role colours are a lookup. Hover and pressed colours mix that rest colour toward
 * `text.primary` at fixed strengths. The map never distorts a family or surface to make a leaf fit.
 *
 * The role list it keys off comes from `contrast-policy.ts`, which `build-theme.ts`'s validation
 * matrix reads too, so a role can never be emitted here without being gated there. Values are
 * formatted with `formatOklch`, the representation the pipeline emits, so the result drops straight
 * into the mode value record `buildModeColors` produces.
 */

import type { Oklch } from './color.js';
import { formatOklch } from './color.js';
import type { ModePath } from './contract.js';
import { SEMANTIC_ROLES } from './contrast-policy.js';
import type { GeneratedSurfaces } from './elevation.js';
import { pathEntry, pathRecord } from './path-record.js';
import type { FamilyRole, ScaleFamily } from './scale.js';
import {
	INTERACTION_HOVER_STRENGTH,
	INTERACTION_PRESSED_STRENGTH,
	mixInteractionState,
} from './scale.js';

/** Every generated colour contract leaf's CSS value, keyed by its dotted path. */
export type SemanticColorValues = {
	[Path in Extract<ModePath, `color.${string}`>]: string;
};

type RoleColorPath = Extract<
	keyof SemanticColorValues,
	| `color.background.${FamilyRole}.${string}`
	| `color.foreground.${FamilyRole}.${string}`
	| `color.border.${FamilyRole}`
>;

type FunctionalColorValues = {
	[Path in Exclude<keyof SemanticColorValues, RoleColorPath>]: string;
};

/** The inputs to {@link mapSemanticColors}. */
interface MapSemanticColorsRequest {
	/**
	 * `color.overlay.backdrop`'s authored value, passed through verbatim (it may carry an alpha
	 * channel).
	 */
	backdrop: string;
	/**
	 * `color.border.control`'s solved value is a dedicated contrast boundary, not a scale-step alias.
	 * `control-border.ts`'s `solveControlBorder` resolves it against `surfaces.canvas` and
	 * `surfaces.recessed` before this map runs, then this function passes it through verbatim.
	 */
	controlBorder: Oklch;
	/** The generated scale family for each role, already mode-resolved. */
	families: Record<FamilyRole, ScaleFamily>;
	/** The resolved keyboard-focus source colour. */
	focus: Oklch;
	/** The generated elevation surface set, already mode-resolved. */
	surfaces: GeneratedSurfaces;
}

/**
 * Resolves every colour contract leaf onto the private families and surfaces, per the locked
 * semantic mapping table. `families` and `surfaces` are already mode-resolved. `backdrop` passes
 * through verbatim. `focus` is the resolved keyboard-focus source colour. Neutral step 12 becomes
 * `text.primary` and is the colour hover and pressed states mix toward.
 */
export function mapSemanticColors(request: MapSemanticColorsRequest): SemanticColorValues {
	return {
		...mapFunctionalColors(request),
		...mapRoleColorValues(request.families),
	};
}

function mapFunctionalColors(request: MapSemanticColorsRequest): FunctionalColorValues {
	const { families, surfaces, backdrop, focus, controlBorder } = request;
	const neutral = families.neutral;
	return {
		'color.surface.canvas': formatOklch(surfaces.canvas),
		'color.surface.recessed': formatOklch(surfaces.recessed),
		'color.surface.floating': formatOklch(surfaces.floating),
		'color.surface.overlay': formatOklch(surfaces.overlay),
		'color.overlay.backdrop': backdrop,
		'color.loadingSkeleton': formatOklch(neutral[8]),
		'color.text.primary': formatOklch(neutral[12]),
		'color.text.secondary': formatOklch(neutral[11]),
		'color.text.disabled': formatOklch(neutral[8]),
		'color.border.decorative': formatOklch(neutral[6]),
		'color.border.control': formatOklch(controlBorder),
		'color.border.focus': formatOklch(focus),
	};
}

function mapRoleColorValues(families: Record<FamilyRole, ScaleFamily>): {
	[Path in RoleColorPath]: string;
} {
	const textPrimary = families.neutral[12];
	return pathRecord(
		SEMANTIC_ROLES.flatMap((role) => {
			const family = families[role];
			const subtle = interactionStates(family[3], textPrimary);
			const solid = interactionStates(family[9], textPrimary);
			const foreground = interactionStates(family[11], textPrimary);
			return [
				pathEntry(`color.background.${role}.subtle.rest`, subtle.rest),
				pathEntry(`color.background.${role}.subtle.hover`, subtle.hover),
				pathEntry(`color.background.${role}.subtle.pressed`, subtle.pressed),
				pathEntry(`color.background.${role}.solid.rest`, solid.rest),
				pathEntry(`color.background.${role}.solid.hover`, solid.hover),
				pathEntry(`color.background.${role}.solid.pressed`, solid.pressed),
				pathEntry(`color.foreground.${role}.rest`, foreground.rest),
				pathEntry(`color.foreground.${role}.hover`, foreground.hover),
				pathEntry(`color.foreground.${role}.pressed`, foreground.pressed),
				pathEntry(`color.foreground.${role}.onSolid`, formatOklch(family.contrast)),
				pathEntry(`color.border.${role}`, formatOklch(family[7])),
			];
		}),
	);
}

function interactionStates(rest: Oklch, toward: Oklch) {
	return {
		rest: formatOklch(rest),
		hover: formatOklch(mixInteractionState(rest, toward, INTERACTION_HOVER_STRENGTH)),
		pressed: formatOklch(mixInteractionState(rest, toward, INTERACTION_PRESSED_STRENGTH)),
	};
}

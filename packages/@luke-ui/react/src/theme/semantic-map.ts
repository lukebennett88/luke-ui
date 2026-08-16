/**
 * The one default semantic colour mapping. `mapSemanticColors` aliases every generated colour
 * contract leaf onto a private scale family's step or a generated surface, per the locked mapping
 * table. It is a pure lookup. No colour math happens here, and it never distorts a family or
 * surface to make a leaf fit.
 *
 * The role list it keys off comes from `contrast-policy.ts`, which `build-theme.ts`'s validation
 * matrix reads too, so a role can never be emitted here without being gated there. Values are
 * formatted with `formatOklch`, the representation the pipeline emits, so the result drops straight
 * into the mode value record `buildModeColors` produces.
 */

import type { Oklch } from './color.js';
import { formatOklch } from './color.js';
import type { ModePath } from './contract.js';
import type { GeneratedSurfaces } from './elevation.js';
import type { FamilyRole, ScaleFamily } from './scale.js';

/** Every generated colour contract leaf's CSS value, keyed by its dotted path. */
export type SemanticColorValues = {
	[Path in Extract<ModePath, `color.${string}`>]: string;
};

type RoleColorPath<Role extends FamilyRole> = Extract<
	keyof SemanticColorValues,
	| `color.background.${Role}.${string}`
	| `color.foreground.${Role}.${string}`
	| `color.border.${Role}`
>;

type RoleColorValues<Role extends FamilyRole> = {
	[Path in RoleColorPath<Role>]: string;
};

type FunctionalColorValues = {
	[Path in Exclude<keyof SemanticColorValues, RoleColorPath<FamilyRole>>]: string;
};

/** The inputs to {@link mapSemanticColors}. */
interface MapSemanticColorsRequest {
	/**
	 * `color.border.control`'s solved value is a dedicated contrast boundary, not a scale-step alias.
	 * `control-border.ts`'s `solveControlBorder` resolves it against `surfaces.canvas` and
	 * `surfaces.recessed` before this map runs, then this function passes it through verbatim.
	 */
	controlBorder: Oklch;
	/** The generated scale family for each role, already mode-resolved. */
	families: Record<FamilyRole, ScaleFamily>;
	/** The authored keyboard-focus source colour. Defaults to the accent family's step 8. */
	focus?: Oklch;
	/** The authored scrim value, passed through verbatim (it may carry an alpha channel). */
	scrim: string;
	/** The generated elevation surface set, already mode-resolved. */
	surfaces: GeneratedSurfaces;
}

/**
 * Resolves every colour contract leaf onto the private families and surfaces, per the locked
 * semantic mapping table. `families` and `surfaces` are already mode-resolved. `scrim` passes through
 * verbatim. `focus` defaults to the accent family's step 8 when the theme author omits it.
 */
export function mapSemanticColors(request: MapSemanticColorsRequest): SemanticColorValues {
	return {
		...mapFunctionalColors(request),
		...mapNeutralColors(request.families.neutral),
		...mapAccentColors(request.families.accent),
		...mapInfoColors(request.families.info),
		...mapSuccessColors(request.families.success),
		...mapWarningColors(request.families.warning),
		...mapDangerColors(request.families.danger),
	};
}

function mapFunctionalColors(request: MapSemanticColorsRequest): FunctionalColorValues {
	const { families, surfaces, scrim, focus, controlBorder } = request;
	const neutral = families.neutral;
	return {
		'color.surface.canvas': formatOklch(surfaces.canvas),
		'color.surface.recessed': formatOklch(surfaces.recessed),
		'color.surface.floating': formatOklch(surfaces.floating),
		'color.surface.overlay': formatOklch(surfaces.overlay),
		'color.scrim': scrim,
		'color.loadingSkeleton': formatOklch(neutral[8]),
		'color.text.primary': formatOklch(neutral[12]),
		'color.text.secondary': formatOklch(neutral[11]),
		'color.text.disabled': formatOklch(neutral[8]),
		'color.border.decorative': formatOklch(neutral[6]),
		'color.border.control': formatOklch(controlBorder),
		'color.border.focus': formatOklch(focus ?? families.accent[8]),
	};
}

function roleSlots(family: ScaleFamily) {
	return {
		border: formatOklch(family[7]),
		foregroundHover: formatOklch(family[12]),
		foregroundRest: formatOklch(family[11]),
		onSolid: formatOklch(family.contrast),
		solidHover: formatOklch(family[10]),
		// Deliberate dup: the pressed solid is carried by depth.recessed / actionControlFinish.recessed /
		// transform, not a third solid colour.
		solidPressed: formatOklch(family[10]),
		solidRest: formatOklch(family[9]),
		subtleHover: formatOklch(family[4]),
		subtlePressed: formatOklch(family[5]),
		subtleRest: formatOklch(family[3]),
	};
}

function mapNeutralColors(family: ScaleFamily): RoleColorValues<'neutral'> {
	const slots = roleSlots(family);
	return {
		'color.background.neutral.solid.hover': slots.solidHover,
		'color.background.neutral.solid.pressed': slots.solidPressed,
		'color.background.neutral.solid.rest': slots.solidRest,
		'color.background.neutral.subtle.hover': slots.subtleHover,
		'color.background.neutral.subtle.pressed': slots.subtlePressed,
		'color.background.neutral.subtle.rest': slots.subtleRest,
		'color.border.neutral': slots.border,
		'color.foreground.neutral.hover': slots.foregroundHover,
		'color.foreground.neutral.onSolid': slots.onSolid,
		'color.foreground.neutral.rest': slots.foregroundRest,
	};
}

function mapAccentColors(family: ScaleFamily): RoleColorValues<'accent'> {
	const slots = roleSlots(family);
	return {
		'color.background.accent.solid.hover': slots.solidHover,
		'color.background.accent.solid.pressed': slots.solidPressed,
		'color.background.accent.solid.rest': slots.solidRest,
		'color.background.accent.subtle.hover': slots.subtleHover,
		'color.background.accent.subtle.pressed': slots.subtlePressed,
		'color.background.accent.subtle.rest': slots.subtleRest,
		'color.border.accent': slots.border,
		'color.foreground.accent.hover': slots.foregroundHover,
		'color.foreground.accent.onSolid': slots.onSolid,
		'color.foreground.accent.rest': slots.foregroundRest,
	};
}

function mapInfoColors(family: ScaleFamily): RoleColorValues<'info'> {
	const slots = roleSlots(family);
	return {
		'color.background.info.solid.hover': slots.solidHover,
		'color.background.info.solid.pressed': slots.solidPressed,
		'color.background.info.solid.rest': slots.solidRest,
		'color.background.info.subtle.hover': slots.subtleHover,
		'color.background.info.subtle.pressed': slots.subtlePressed,
		'color.background.info.subtle.rest': slots.subtleRest,
		'color.border.info': slots.border,
		'color.foreground.info.hover': slots.foregroundHover,
		'color.foreground.info.onSolid': slots.onSolid,
		'color.foreground.info.rest': slots.foregroundRest,
	};
}

function mapSuccessColors(family: ScaleFamily): RoleColorValues<'success'> {
	const slots = roleSlots(family);
	return {
		'color.background.success.solid.hover': slots.solidHover,
		'color.background.success.solid.pressed': slots.solidPressed,
		'color.background.success.solid.rest': slots.solidRest,
		'color.background.success.subtle.hover': slots.subtleHover,
		'color.background.success.subtle.pressed': slots.subtlePressed,
		'color.background.success.subtle.rest': slots.subtleRest,
		'color.border.success': slots.border,
		'color.foreground.success.hover': slots.foregroundHover,
		'color.foreground.success.onSolid': slots.onSolid,
		'color.foreground.success.rest': slots.foregroundRest,
	};
}

function mapWarningColors(family: ScaleFamily): RoleColorValues<'warning'> {
	const slots = roleSlots(family);
	return {
		'color.background.warning.solid.hover': slots.solidHover,
		'color.background.warning.solid.pressed': slots.solidPressed,
		'color.background.warning.solid.rest': slots.solidRest,
		'color.background.warning.subtle.hover': slots.subtleHover,
		'color.background.warning.subtle.pressed': slots.subtlePressed,
		'color.background.warning.subtle.rest': slots.subtleRest,
		'color.border.warning': slots.border,
		'color.foreground.warning.hover': slots.foregroundHover,
		'color.foreground.warning.onSolid': slots.onSolid,
		'color.foreground.warning.rest': slots.foregroundRest,
	};
}

function mapDangerColors(family: ScaleFamily): RoleColorValues<'danger'> {
	const slots = roleSlots(family);
	return {
		'color.background.danger.solid.hover': slots.solidHover,
		'color.background.danger.solid.pressed': slots.solidPressed,
		'color.background.danger.solid.rest': slots.solidRest,
		'color.background.danger.subtle.hover': slots.subtleHover,
		'color.background.danger.subtle.pressed': slots.subtlePressed,
		'color.background.danger.subtle.rest': slots.subtleRest,
		'color.border.danger': slots.border,
		'color.foreground.danger.hover': slots.foregroundHover,
		'color.foreground.danger.onSolid': slots.onSolid,
		'color.foreground.danger.rest': slots.foregroundRest,
	};
}

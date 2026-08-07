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
import { SEMANTIC_ROLES } from './contrast-policy.js';
import type { GeneratedSurfaces } from './elevation.js';
import type { FamilyRole, ScaleFamily } from './scale.js';

type ColorMode = 'light' | 'dark';

/** Every generated colour contract leaf's CSS value, keyed by its dotted path (for example
 * `'color.text.primary'`), plus the passed-through `'color.scrim'`. */
export type SemanticColorValues = Record<string, string>;

/** The inputs to {@link mapSemanticColors}. */
interface MapSemanticColorsRequest {
	/** The generated scale family for each role, already resolved for `mode`. */
	families: Record<FamilyRole, ScaleFamily>;
	/** The generated elevation surface set, already resolved for `mode`. */
	surfaces: GeneratedSurfaces;
	/**
	 * `color.border.control`'s solved value is a dedicated contrast boundary, not a scale-step alias.
	 * `control-border.ts`'s `solveControlBorder` resolves it against `surfaces.canvas` and
	 * `surfaces.recessed` before this map runs, then this function passes it through verbatim.
	 */
	controlBorder: Oklch;
	/** The authored scrim value, passed through verbatim (it may carry an alpha channel). */
	scrim: string;
	/** The authored keyboard-focus source colour. Defaults to the accent family's step 8. */
	focus?: Oklch;
	/** The colour mode the families and surfaces were resolved for. */
	mode: ColorMode;
}

/**
 * Resolves every colour contract leaf onto the private families and surfaces, per the locked
 * semantic mapping table. `families` and `surfaces` are already mode-resolved. `scrim` passes through
 * verbatim. `focus` defaults to the accent family's step 8 when the theme author omits it.
 */
export function mapSemanticColors(request: MapSemanticColorsRequest): SemanticColorValues {
	const { families, surfaces, scrim, focus, controlBorder } = request;
	const neutral = families.neutral;
	const values: Record<string, string> = {};

	// Surfaces: canvas IS the background, so it is aliased here rather than recomputed.
	values['color.surface.canvas'] = formatOklch(surfaces.canvas);
	values['color.surface.recessed'] = formatOklch(surfaces.recessed);
	values['color.surface.floating'] = formatOklch(surfaces.floating);
	values['color.surface.overlay'] = formatOklch(surfaces.overlay);
	values['color.scrim'] = scrim;
	values['color.loadingSkeleton'] = formatOklch(neutral[8]);

	// Functional text and borders: neutral only, and distinct from the six shared roles that share the
	// `border` branch with them.
	values['color.text.primary'] = formatOklch(neutral[12]);
	values['color.text.secondary'] = formatOklch(neutral[11]);
	values['color.text.disabled'] = formatOklch(neutral[8]);
	values['color.border.decorative'] = formatOklch(neutral[6]);
	values['color.border.control'] = formatOklch(controlBorder);
	values['color.border.focus'] = formatOklch(focus ?? families.accent[8]);

	// The shared semantic contract: every role maps onto its own family through the same steps, so a
	// role's meaning never decides which visual slots it can fill.
	for (const role of SEMANTIC_ROLES) {
		const family = families[role];
		values[`color.background.${role}.subtle.rest`] = formatOklch(family[3]);
		values[`color.background.${role}.subtle.hover`] = formatOklch(family[4]);
		values[`color.background.${role}.subtle.pressed`] = formatOklch(family[5]);
		values[`color.background.${role}.solid.rest`] = formatOklch(family[9]);
		values[`color.background.${role}.solid.hover`] = formatOklch(family[10]);
		// Deliberate dup: the pressed solid is carried by depth.recessed / actionControlFinish.recessed /
		// transform, not a third solid colour.
		values[`color.background.${role}.solid.pressed`] = formatOklch(family[10]);
		values[`color.foreground.${role}.rest`] = formatOklch(family[11]);
		values[`color.foreground.${role}.hover`] = formatOklch(family[12]);
		values[`color.foreground.${role}.onSolid`] = formatOklch(family.contrast);
		values[`color.border.${role}`] = formatOklch(family[7]);
	}

	return values;
}

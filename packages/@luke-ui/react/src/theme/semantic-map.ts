/**
 * The one default semantic colour mapping. `mapSemanticColors` aliases every generated colour
 * contract leaf onto a private scale family's step or a generated surface, per the locked mapping
 * table. It is a pure lookup aside from the two interaction overlay sources, which alias the
 * high-contrast neutral. It never distorts a family or surface to make a leaf fit.
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

/** Every generated colour contract leaf's CSS value, keyed by its dotted path (for example
 * `'color.text.primary'`), plus the passed-through `'color.overlay.backdrop'`. */
export type SemanticColorValues = Record<string, string>;

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
	/** The authored keyboard-focus source colour. Defaults to the accent family's step 8. */
	focus?: Oklch;
	/** The generated elevation surface set, already mode-resolved. */
	surfaces: GeneratedSurfaces;
}

/**
 * Resolves every colour contract leaf onto the private families and surfaces, per the locked
 * semantic mapping table. `families` and `surfaces` are already mode-resolved. `backdrop` passes
 * through verbatim. Hover and pressed overlay sources alias `families.neutral[12]`. Recipes mix
 * that source into the current fill at the shared strengths in `interaction-overlay.ts`.
 * `focus` defaults to the accent family's step 8 when the theme author omits it.
 */
export function mapSemanticColors(request: MapSemanticColorsRequest): SemanticColorValues {
	const { families, surfaces, backdrop, focus, controlBorder } = request;
	const neutral = families.neutral;
	const overlaySource = formatOklch(neutral[12]);
	const values: Record<string, string> = {};

	// Surfaces: canvas IS the background, so it is aliased here rather than recomputed.
	values['color.surface.canvas'] = formatOklch(surfaces.canvas);
	values['color.surface.recessed'] = formatOklch(surfaces.recessed);
	values['color.surface.floating'] = formatOklch(surfaces.floating);
	values['color.surface.overlay'] = formatOklch(surfaces.overlay);
	values['color.overlay.backdrop'] = backdrop;
	values['color.overlay.hover'] = overlaySource;
	values['color.overlay.pressed'] = overlaySource;
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
		values[`color.background.${role}.subtle`] = formatOklch(family[3]);
		// Step 10 is a private scale rung. Public hover and pressed mix `color.overlay` into step 9.
		values[`color.background.${role}.solid`] = formatOklch(family[9]);
		values[`color.foreground.${role}.rest`] = formatOklch(family[11]);
		values[`color.foreground.${role}.hover`] = formatOklch(family[12]);
		values[`color.foreground.${role}.onSolid`] = formatOklch(family.contrast);
		values[`color.border.${role}`] = formatOklch(family[7]);
	}

	return values;
}

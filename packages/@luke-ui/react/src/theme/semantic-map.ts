/**
 * The one default semantic colour mapping. `mapSemanticColors` aliases every generated colour
 * contract leaf onto a private family rung or a generated surface. It is a pure lookup. It never
 * distorts a family or surface to make a leaf fit.
 */

import type { Oklch } from './color.js';
import { formatOklch } from './color.js';
import { SEMANTIC_ROLES } from './contrast-policy.js';
import type { GeneratedSurfaces } from './elevation.js';
import type { FamilyRole, ScaleFamily } from './scale.js';

/** Every generated colour contract leaf's CSS value, keyed by its dotted path. */
export type SemanticColorValues = Record<string, string>;

/** The inputs to {@link mapSemanticColors}. */
interface MapSemanticColorsRequest {
	/**
	 * `color.overlay.backdrop`'s authored value, passed through verbatim (it may carry an alpha
	 * channel).
	 */
	backdrop: string;
	/**
	 * `color.border.control`'s solved value is a dedicated contrast boundary, not a family-rung
	 * alias.
	 */
	controlBorder: Oklch;
	/** The generated scale family for each role, already mode-resolved. */
	families: Record<FamilyRole, ScaleFamily>;
	/** The authored keyboard-focus source colour. Defaults to the accent family's mid rung. */
	focus?: Oklch;
	/** The generated elevation surface set, already mode-resolved. */
	surfaces: GeneratedSurfaces;
}

/**
 * Resolves every colour contract leaf onto the private families and surfaces. `backdrop` and
 * `controlBorder` pass through verbatim. Neutral `highContrast` becomes `text.primary` and is the
 * interaction source recipes mix toward at runtime. `focus` defaults to the accent mid rung when
 * the theme author omits it.
 */
export function mapSemanticColors(request: MapSemanticColorsRequest): SemanticColorValues {
	const { families, surfaces, backdrop, focus, controlBorder } = request;
	const neutral = families.neutral;
	const values: Record<string, string> = {};

	values['color.surface.canvas'] = formatOklch(surfaces.canvas);
	values['color.surface.recessed'] = formatOklch(surfaces.recessed);
	values['color.surface.floating'] = formatOklch(surfaces.floating);
	values['color.surface.overlay'] = formatOklch(surfaces.overlay);
	values['color.overlay.backdrop'] = backdrop;
	values['color.loadingSkeleton'] = formatOklch(neutral.mid);

	values['color.text.primary'] = formatOklch(neutral.highContrast);
	values['color.text.secondary'] = formatOklch(neutral.foreground);
	values['color.text.disabled'] = formatOklch(neutral.mid);
	values['color.border.decorative'] = formatOklch(neutral.decorative);
	values['color.border.control'] = formatOklch(controlBorder);
	values['color.border.focus'] = formatOklch(focus ?? families.accent.mid);

	for (const role of SEMANTIC_ROLES) {
		const family = families[role];
		values[`color.background.${role}.subtle`] = formatOklch(family.subtle);
		values[`color.background.${role}.solid`] = formatOklch(family.solid);
		values[`color.foreground.${role}.default`] = formatOklch(family.foreground);
		values[`color.foreground.${role}.onSolid`] = formatOklch(family.onSolid);
		values[`color.border.${role}`] = formatOklch(family.border);
	}

	return values;
}

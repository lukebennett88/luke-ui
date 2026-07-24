/**
 * The one default semantic colour mapping. `mapSemanticColors` aliases every generated colour
 * contract leaf onto a private scale family's step or a generated surface, per the locked mapping
 * table. It is a pure lookup: no colour math happens here, and it never distorts a family or
 * surface to make a leaf fit.
 *
 * Isolated by design: nothing here is wired into `buildTheme` yet (that is a later stage). Values
 * are formatted with `formatOklch`, the same representation the current pipeline emits, so the
 * result can be dropped straight into the mode value record `buildModeColors` produces today.
 */

import type { Oklch } from './color.js';
import { formatOklch } from './color.js';
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
	 * `color.border.control`'s solved value: a dedicated contrast boundary (Stage 6 Option B), not a
	 * scale-step alias. Resolved by `build-theme.ts`'s `solveControlBorder` against `surfaces.canvas`
	 * and `surfaces.recessed` before this map runs; passed through verbatim here.
	 */
	controlBorder: Oklch;
	/** The authored scrim value, passed through verbatim (it may carry an alpha channel). */
	scrim: string;
	/** The authored keyboard-focus source colour. Defaults to the accent family's step 8. */
	focus?: Oklch;
	/** The colour mode the families and surfaces were resolved for. */
	mode: ColorMode;
}

// Action intents render the full interactive ramp; feedback intents are static and expose only the
// soft kit (subtle surface + border + text). Mirrors ACTION_INTENTS/FEEDBACK_INTENTS in
// build-theme.ts.
const ACTION_INTENTS = ['neutral', 'accent', 'danger'] as const;
// Accent and danger additionally expose a border and low-contrast text; neutral does not (its
// borders/text are the global neutral leaves instead).
const BORDER_AND_TEXT_INTENTS = ['accent', 'danger'] as const;
const FEEDBACK_INTENTS = ['info', 'success', 'warning'] as const;

/**
 * Resolves every colour contract leaf onto the private families and surfaces, per the locked
 * semantic mapping table. `families`/`surfaces` are already mode-resolved; `scrim` passes through
 * verbatim; `focus` defaults to the accent family's step 8 when the theme author omits it.
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
	values['color.loadingSkeleton'] = formatOklch(neutral[7]);

	// Global text / borders: neutral only.
	values['color.text.primary'] = formatOklch(neutral[12]);
	values['color.text.secondary'] = formatOklch(neutral[11]);
	values['color.text.disabled'] = formatOklch(neutral[8]);
	values['color.border.decorative'] = formatOklch(neutral[6]);
	values['color.border.control'] = formatOklch(controlBorder);
	values['color.border.focus'] = formatOklch(focus ?? families.accent[8]);

	// Action intents: full ramp, keyed to the intent's own family.
	for (const role of ACTION_INTENTS) {
		const family = families[role];
		values[`color.intent.${role}.surface.subtle`] = formatOklch(family[3]);
		values[`color.intent.${role}.surface.subtleHover`] = formatOklch(family[4]);
		values[`color.intent.${role}.surface.subtlePressed`] = formatOklch(family[5]);
		values[`color.intent.${role}.surface.solid`] = formatOklch(family[9]);
		values[`color.intent.${role}.surface.solidHover`] = formatOklch(family[10]);
		// Deliberate dup: pressed is carried by depth.recessed / actionControlFinish.recessed /
		// transform, not a distinct colour.
		values[`color.intent.${role}.surface.solidPressed`] = formatOklch(family[10]);
		values[`color.intent.${role}.onSolid`] = formatOklch(family.contrast);
	}
	for (const role of BORDER_AND_TEXT_INTENTS) {
		const family = families[role];
		values[`color.intent.${role}.border`] = formatOklch(family[7]);
		values[`color.intent.${role}.text`] = formatOklch(family[11]);
	}
	values['color.intent.accent.textHover'] = formatOklch(families.accent[12]);

	// Feedback intents: reduced kit only (subtle surface + border + text).
	for (const role of FEEDBACK_INTENTS) {
		const family = families[role];
		values[`color.intent.${role}.surface.subtle`] = formatOklch(family[3]);
		values[`color.intent.${role}.border`] = formatOklch(family[7]);
		values[`color.intent.${role}.text`] = formatOklch(family[11]);
	}

	return values;
}

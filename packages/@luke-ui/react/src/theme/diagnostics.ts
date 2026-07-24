/**
 * The theme compiler's diagnostics data model. Family-level diagnostics are populated by the scale
 * generator ({@link import('./scale.js').generateFamilyWithDiagnostics}) in Stage 3. The theme-level
 * {@link ThemeDiagnostics} (complete, only for a fully compiled theme) and
 * {@link ThemeGenerationDiagnostics} (partial, for a build that failed part-way) are consumed by
 * `compileTheme` / `ThemeGenerationError` in `build-theme.ts` (Stage 6).
 */

import type { Oklch } from './color.js';
import type { GeneratedSurfaces } from './elevation.js';
import type { FamilyRequirements, FamilyRole, ScaleFamily, ScaleStep } from './scale.js';

/** A chroma reduction forced by sRGB gamut mapping on one generated rung. */
export interface GamutReduction {
	/** The step whose chroma was reduced. */
	step: ScaleStep;
	/** The chroma the generator requested before gamut mapping. */
	requestedChroma: number;
	/** The chroma left after mapping the colour into the sRGB gamut. */
	resolvedChroma: number;
}

/** How the step-9 solid anchor was resolved for a family. */
export interface SolidAnchorDiagnostics {
	/** The lightness the search preferred: the source lightness (vibrant) or the curated target (neutral). */
	targetLightness: number;
	/** The lightness the solid anchor resolved to. */
	resolvedLightness: number;
	/** The lightness range the solid-anchor search was allowed to explore. */
	band: [number, number];
	/** Whether the anchor was moved off its preferred lightness to satisfy the on-solid gate. */
	adaptedForOnSolid: boolean;
	/** The on-solid contrast achieved against the solid (step 9). */
	onSolidRatioSolid: number;
	/** The on-solid contrast achieved against the solid hover (step 10). */
	onSolidRatioSolidHover: number;
	/** Whether the family satisfies its on-solid guarantee (always true when the role does not need one). */
	satisfied: boolean;
}

/**
 * Everything the scale generator resolved for one family in one mode: the inputs, the generated
 * scale, the resolved solid anchor, the chosen on-solid colour, and any gamut-driven reductions.
 */
export interface FamilyDiagnostics {
	/** The semantic role the family was generated for. */
	role: FamilyRole;
	/** The colour mode the family was generated for. */
	mode: 'light' | 'dark';
	/** The capability guarantees the role declares. */
	requirements: FamilyRequirements;
	/** The family character the generator was given. */
	source: Oklch;
	/** The canvas anchor the generator was given. */
	background: Oklch;
	/** The generated 12-step family plus its on-solid colour. */
	family: ScaleFamily;
	/** How the step-9 solid anchor was resolved. */
	solidAnchor: SolidAnchorDiagnostics;
	/** The chosen on-solid colour and the contrast it reaches over the solid and its hover. */
	onSolid: { color: Oklch; ratioSolid: number; ratioSolidHover: number };
	/** Every rung whose chroma the sRGB gamut forced down. */
	gamutReductions: Array<GamutReduction>;
}

/**
 * One WCAG pair the semantic validation matrix checked while compiling a theme mode. Records the
 * factual ratio and whether it clears the required minimum; not every recorded check is a build-time
 * hard gate (see `build-theme.ts` for which contribute to a thrown {@link
 * import('./build-theme.js').ThemeContrastError}).
 */
export interface ContrastCheck {
	/** Token path of the foreground colour, for example `color.text.primary`. */
	foreground: string;
	/** Token path of the background colour, for example `color.surface.floating`. */
	background: string;
	/** The WCAG 2.2 contrast ratio the pair achieves. */
	ratio: number;
	/** The ratio the pair is measured against (4.5 for text, 3 for non-text UI). */
	required: number;
	/** Whether the achieved ratio clears the required minimum. */
	passes: boolean;
}

/** Everything the compiler resolved for one colour mode of a fully compiled theme. */
export interface ThemeModeDiagnostics {
	/** The colour mode the diagnostics describe. */
	mode: 'light' | 'dark';
	/** The per-role scale families the mode was generated from. */
	families: Record<FamilyRole, FamilyDiagnostics>;
	/** The mode-aware elevation surfaces the canvas anchor produced. */
	surfaces: GeneratedSurfaces;
	/** Every WCAG pair the semantic validation matrix checked for the mode. */
	contrastChecks: Array<ContrastCheck>;
}

/**
 * Diagnostics for a fully compiled, successful theme: both modes complete. Reserved for a theme that
 * cleared every hard contrast gate — {@link import('./build-theme.js').compileTheme} returns it
 * alongside the emitted CSS.
 */
export interface ThemeDiagnostics {
	/** The light mode's complete diagnostics. */
	light: ThemeModeDiagnostics;
	/** The dark mode's complete diagnostics. */
	dark: ThemeModeDiagnostics;
}

/**
 * Partial diagnostics for a build that failed part-way through family generation. A half-finished
 * build cannot have complete {@link ThemeDiagnostics}, so this carries only what was resolved before
 * the failing role threw. Attached to {@link import('./build-theme.js').ThemeGenerationError}.
 */
export interface ThemeGenerationDiagnostics {
	/** The mode being compiled when generation failed. */
	mode: 'light' | 'dark';
	/** The role whose family could not be generated. */
	role: FamilyRole;
	/** The families successfully generated for the failing mode before the failure. */
	completedFamilies: Partial<Record<FamilyRole, FamilyDiagnostics>>;
}

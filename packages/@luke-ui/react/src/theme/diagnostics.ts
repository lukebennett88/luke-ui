/**
 * The theme compiler's diagnostics data model. Family-level diagnostics are populated by the scale
 * generator ({@link import('./scale.js').generateFamilyWithDiagnostics}). The theme-level
 * {@link ThemeDiagnostics} (complete, only for a fully compiled theme) and
 * {@link ThemeGenerationDiagnostics} (partial, for a build that failed part-way) are consumed by
 * `compileTheme` / `ThemeGenerationError` in `build-theme.ts`.
 */

import type { Oklch } from './color.js';
import type { GeneratedSurfaces } from './elevation.js';
import type { FamilyRole, ScaleFamily, ScaleStep } from './scale.js';

/** A chroma reduction forced by sRGB gamut mapping on one generated rung. */
export interface GamutReduction {
	/** The chroma the generator requested before gamut mapping. */
	requestedChroma: number;
	/** The chroma left after mapping the colour into the sRGB gamut. */
	resolvedChroma: number;
	/** The step whose chroma was reduced. */
	step: ScaleStep;
}

/** How the step-9 solid anchor was resolved for a family. */
export interface SolidAnchorDiagnostics {
	/** Whether the anchor was moved off its preferred lightness to satisfy the on-solid gate. */
	adaptedForOnSolid: boolean;
	/** The lightness range the solid-anchor search was allowed to explore. */
	band: [number, number];
	/** The lightness the solid anchor resolved to. */
	resolvedLightness: number;
	/** Whether on-solid text clears WCAG AA across the public solid rest, hover, and pressed colours. */
	satisfied: boolean;
	/** The lightness the search preferred: the source lightness (vibrant) or the curated target (neutral). */
	targetLightness: number;
}

/**
 * Everything the scale generator resolved for one family in one mode: the inputs, the generated
 * scale, the resolved solid anchor, the chosen on-solid colour, and any gamut-driven reductions.
 */
export interface FamilyDiagnostics {
	/** The canvas anchor the generator was given. */
	background: Oklch;
	/** The generated 12-step family plus its on-solid colour. */
	family: ScaleFamily;
	/** Every rung whose chroma the sRGB gamut forced down. */
	gamutReductions: Array<GamutReduction>;
	/** The colour mode the family was generated for. */
	mode: 'light' | 'dark';
	/** The chosen on-solid colour and the contrast it reaches over the public solid rest, hover, and pressed. */
	onSolid: { color: Oklch; ratioRest: number; ratioHover: number; ratioPressed: number };
	/** The semantic role the family was generated for. */
	role: FamilyRole;
	/** How the step-9 solid anchor was resolved. */
	solidAnchor: SolidAnchorDiagnostics;
	/** The family character the generator was given. */
	source: Oklch;
}

/**
 * One WCAG pair the semantic validation matrix checked while compiling a theme mode. Records the
 * factual ratio, whether it clears the required minimum, and whether the compiler treats it as a hard
 * gate. Tooling reads that classification instead of inferring it from token paths.
 */
export interface ContrastCheck {
	/** Token path of the background colour, for example `color.surface.floating`. */
	background: string;
	/** Token path of the foreground colour, for example `color.text.primary`. */
	foreground: string;
	/**
	 * Whether missing `required` fails the build: `true` for a hard gate that contributes to a thrown
	 * {@link import('./build-theme.js').ThemeContrastError}, `false` for an advisory check that is
	 * measured and reported only.
	 */
	hard: boolean;
	/** Whether the achieved ratio clears the required minimum. */
	passes: boolean;
	/** The WCAG 2.2 contrast ratio the pair achieves. */
	ratio: number;
	/** The ratio the pair is measured against (4.5 for text, 3 for non-text UI). */
	required: number;
}

/** Everything the compiler resolved for one colour mode of a fully compiled theme. */
export interface ThemeModeDiagnostics {
	/** Every WCAG pair the semantic validation matrix checked for the mode. */
	contrastChecks: Array<ContrastCheck>;
	/** The per-role scale families the mode was generated from. */
	families: Record<FamilyRole, FamilyDiagnostics>;
	/** The colour mode the diagnostics describe. */
	mode: 'light' | 'dark';
	/** The mode-aware elevation surfaces the canvas anchor produced. */
	surfaces: GeneratedSurfaces;
}

/**
 * Diagnostics for a fully compiled, successful theme: both modes complete. Reserved for a theme that
 * cleared every hard contrast gate — {@link import('./build-theme.js').compileTheme} returns it
 * alongside the emitted CSS.
 */
export interface ThemeDiagnostics {
	/** The dark mode's complete diagnostics. */
	dark: ThemeModeDiagnostics;
	/** The light mode's complete diagnostics. */
	light: ThemeModeDiagnostics;
}

/**
 * Partial diagnostics for a build that failed part-way through family generation. A half-finished
 * build cannot have complete {@link ThemeDiagnostics}, so this carries only what was resolved before
 * the failing role threw. Attached to {@link import('./build-theme.js').ThemeGenerationError}.
 */
export interface ThemeGenerationDiagnostics {
	/** The families successfully generated for the failing mode before the failure. */
	completedFamilies: Partial<Record<FamilyRole, FamilyDiagnostics>>;
	/** The mode being compiled when generation failed. */
	mode: 'light' | 'dark';
	/** The role whose family could not be generated. */
	role: FamilyRole;
}

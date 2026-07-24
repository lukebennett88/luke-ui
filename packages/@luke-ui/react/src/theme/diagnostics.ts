/**
 * The theme compiler's diagnostics data model. Family-level diagnostics are populated by the scale
 * generator ({@link import('./scale.js').generateFamilyWithDiagnostics}) in Stage 3. The theme-level
 * {@link ThemeDiagnostics} (complete, only for a fully compiled theme) and
 * {@link ThemeGenerationDiagnostics} (partial, for a build that failed part-way) are declared here
 * now and fleshed out when the generator is wired into `compileTheme` in Stage 6.
 */

import type { Oklch } from './color.js';
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
 * One WCAG contrast pair recorded while validating a compiled theme. Populated in Stage 6, when the
 * semantic mapping and surfaces exist and the validation matrix runs.
 */
export interface ContrastCheck {
	/** Token path of the foreground colour. */
	foreground: string;
	/** Token path of the background colour. */
	background: string;
	/** The achieved contrast ratio. */
	ratio: number;
	/** The WCAG 2.2 AA ratio the pair must reach. */
	required: number;
	/** Whether the pair meets its required ratio. */
	passes: boolean;
}

/**
 * The diagnostics for one mode of a fully compiled theme. Stage 3 populates `families`; `surfaces`,
 * `semanticValues`, and `contrastChecks` are filled in once the elevation model, semantic mapping,
 * and validator are wired in (Stages 4-6).
 */
export interface ThemeModeDiagnostics {
	/** Per-role family diagnostics for this mode. */
	families: Record<FamilyRole, FamilyDiagnostics>;
	/** The generated elevation surfaces (canvas / recessed / floating / overlay). Stage 4+. */
	surfaces: Record<string, Oklch>;
	/** The resolved semantic colour values keyed by contract leaf. Stage 5+. */
	semanticValues: Record<string, string>;
	/** Every WCAG validation pair checked for this mode. Stage 6+. */
	contrastChecks: Array<ContrastCheck>;
}

/**
 * The complete diagnostics of a fully compiled theme: both modes, with families, surfaces, semantic
 * values, and contrast checks all populated. Reserved for a successful build — a build that fails
 * part-way carries {@link ThemeGenerationDiagnostics} instead.
 */
export interface ThemeDiagnostics {
	/** The light-mode diagnostics. */
	light: ThemeModeDiagnostics;
	/** The dark-mode diagnostics. */
	dark: ThemeModeDiagnostics;
}

/**
 * The diagnostics captured when a build fails part-way through generating its families. Explicitly
 * partial: a failed build cannot have complete semantic diagnostics, so each mode holds only what
 * had been resolved when the build threw, alongside the failing `role`/`mode`.
 */
export interface ThemeGenerationDiagnostics {
	/** The role and mode whose family generation failed. */
	failure: { role: FamilyRole; mode: 'light' | 'dark' };
	/** Whatever light-mode diagnostics existed at the point of failure. */
	light?: Partial<ThemeModeDiagnostics>;
	/** Whatever dark-mode diagnostics existed at the point of failure. */
	dark?: Partial<ThemeModeDiagnostics>;
}

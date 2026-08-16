import type { ModePath } from './contract.js';
import { SEMANTIC_ROLES } from './contrast-policy.js';
import type { ThemeContrastFailure } from './contrast-validation.js';
import { validateContrast } from './contrast-validation.js';
import { solveControlBorder } from './control-border.js';
import type {
	FamilyDiagnostics,
	ThemeDiagnostics,
	ThemeGenerationDiagnostics,
	ThemeModeDiagnostics,
} from './diagnostics.js';
import type { GeneratedSurfaces } from './elevation.js';
import { generateSurfaces } from './elevation.js';
import type { ThemeInheritance } from './extend-theme.js';
import type { ThemeFoundation, ThemeModeFoundation } from './foundation.js';
import type { FamilyRole, ScaleFamily } from './scale.js';
import { generateFamilyWithDiagnostics, ScaleGenerationError } from './scale.js';
import type { SemanticColorValues } from './semantic-map.js';
import { mapSemanticColors } from './semantic-map.js';
import { assembleStylesheet } from './stylesheet.js';
import { validateFoundation } from './validate-foundation.js';

/**
 * Compiles a theme foundation into a complete static stylesheet plus its {@link ThemeDiagnostics}.
 *
 * Per mode: takes the already-resolved source colours and canvas anchor, generates the six private
 * scale families (neutral / accent / info / success / warning / danger), derives the mode-aware
 * elevation surfaces, applies the one default semantic mapping onto the colour contract, and runs
 * the full WCAG 2.2 validation matrix — which stays authoritative for text and on-solid pairs.
 *
 * Pure and Node-compatible: no DOM and deterministic output. Throws {@link ThemeGenerationError}
 * when a role that must guarantee on-solid contrast cannot reach an accessible solid (an inaccessible
 * explicit per-mode accent, for example), and {@link ThemeContrastError} when a generated text or
 * on-solid pair misses AA. The returned `diagnostics` describe a fully compiled theme only; a build
 * that throws never returns them. Colours are computed and emitted in OKLCH.
 */
export function compileTheme(foundation: ThemeFoundation): {
	css: string;
	diagnostics: ThemeDiagnostics;
} {
	validateFoundation(foundation);
	const light = buildModeValues('light', foundation.light);
	const dark = buildModeValues('dark', foundation.dark);
	const failures = [...light.failures, ...dark.failures];
	if (failures.length > 0) throw new ThemeContrastError(failures);
	return {
		css: assembleStylesheet(foundation, light.values, dark.values),
		diagnostics: { dark: dark.diagnostics, light: light.diagnostics },
	};
}

/**
 * Compiles a theme foundation into a complete static stylesheet. Thin wrapper over
 * {@link compileTheme} that returns only the emitted CSS; callers that need the diagnostics data
 * model (tests, Storybook) use `compileTheme` directly. Throws the same errors as `compileTheme`.
 */
export function buildTheme(foundation: ThemeFoundation): string {
	return compileTheme(foundation).css;
}

// Re-exported so `./build-theme.js` stays the one import path for the compiler's public surface,
// now that the failure shape lives in its own module.
export type { ThemeContrastFailure } from './contrast-validation.js';

/** The colour provenance `defineTheme` records for a theme built from an `extends` chain. */
export type { ThemeInheritance } from './extend-theme.js';

/**
 * Thrown by `buildTheme` when generated colours miss WCAG 2.2 AA contrast. Aggregates every
 * failing mode-and-pair before throwing, one per message line. For a theme built with `extends`,
 * `inheritance` names the chain of themes and which colours came from a base.
 */
export class ThemeContrastError extends Error {
	/** Every failing pair across both modes. */
	readonly failures: Array<ThemeContrastFailure>;
	/** The colour provenance, or `null` when the theme extends nothing. */
	readonly inheritance: ThemeInheritance | null;

	constructor(failures: Array<ThemeContrastFailure>, inheritance: ThemeInheritance | null = null) {
		super(
			[
				'Theme foundation fails WCAG 2.2 AA contrast:',
				...failures.map((failure) => {
					return (
						`${failure.mode}: ${failure.foreground} on ${failure.background} — ` +
						`${failure.ratio.toFixed(2)}:1 < ${failure.required}:1`
					);
				}),
				...inheritanceLines(inheritance),
			].join('\n'),
		);
		this.failures = failures;
		this.inheritance = inheritance;
		this.name = 'ThemeContrastError';
	}
}

/** The message lines that trace a failing theme back to the themes its colours came from. */
function inheritanceLines(inheritance: ThemeInheritance | null): Array<string> {
	if (inheritance === null) return [];
	const provenance = [
		inheritance.inheritedColors.length > 0
			? `Inherited colours: ${inheritance.inheritedColors.join(', ')}.`
			: '',
		inheritance.ownColors.length > 0 ? `Own colours: ${inheritance.ownColors.join(', ')}.` : '',
	].filter((sentence) => sentence !== '');
	const lines = [`Theme ${inheritance.chain.map((name) => `"${name}"`).join(' extends ')}.`];
	if (provenance.length > 0) lines.push(provenance.join(' '));
	return lines;
}

/**
 * Thrown by {@link compileTheme} when a role that must guarantee on-solid contrast cannot reach an
 * accessible solid — for example an explicit per-mode accent whose whole tone band is an on-solid
 * dead zone. Single-value accents are pre-conditioned into an accessible band by `defineTheme`, so
 * this surfaces for verbatim sources the author asked to use exactly: a per-mode accent, or any status
 * source, which `defineTheme` passes through unadapted. Re-raises the scale generator's
 * {@link ScaleGenerationError} with the failing `role`/`mode`, the closest `bestAttempt`, and the
 * partial {@link ThemeGenerationDiagnostics} resolved before the failure.
 */
export class ThemeGenerationError extends Error {
	/** The role whose family could not be generated. */
	readonly role: FamilyRole;
	/** The mode the family was being generated for. */
	readonly mode: ColorMode;
	/** The closest the solid-anchor search came to satisfying the on-solid gate. */
	readonly bestAttempt: ScaleGenerationError['bestAttempt'];
	/** The partial diagnostics resolved before the failing role threw. */
	readonly diagnostics: ThemeGenerationDiagnostics;

	constructor(cause: ScaleGenerationError, diagnostics: ThemeGenerationDiagnostics) {
		super(cause.message);
		this.role = cause.role;
		this.mode = cause.mode;
		this.bestAttempt = cause.bestAttempt;
		this.diagnostics = diagnostics;
		this.name = 'ThemeGenerationError';
	}
}

type ColorMode = 'light' | 'dark';

interface ModeValues {
	diagnostics: ThemeModeDiagnostics;
	failures: Array<ThemeContrastFailure>;
	values: Record<ModePath, string>;
}

function buildModeValues(mode: ColorMode, modeFoundation: ThemeModeFoundation): ModeValues {
	const { colorValues, familyDiagnostics, surfaces } = buildModeColors(mode, modeFoundation);
	const { checks, failures } = validateContrast(mode, colorValues);
	const values: Record<ModePath, string> = {
		...colorValues,
		'actionControlFinish.raised': modeFoundation.actionControlFinish.raised,
		'actionControlFinish.recessed': modeFoundation.actionControlFinish.recessed,
		'actionControlFinish.resting': modeFoundation.actionControlFinish.resting,
		'depth.floating': modeFoundation.depth.floating,
		'depth.overlay': modeFoundation.depth.overlay,
		'depth.raised': modeFoundation.depth.raised,
		'depth.recessed': modeFoundation.depth.recessed,
		'depth.resting': modeFoundation.depth.resting,
	};
	return {
		diagnostics: { contrastChecks: checks, families: familyDiagnostics, mode, surfaces },
		failures,
		values,
	};
}

interface ModeColors {
	colorValues: SemanticColorValues;
	familyDiagnostics: Record<FamilyRole, FamilyDiagnostics>;
	surfaces: GeneratedSurfaces;
}

/**
 * Runs the v2 colour pipeline for one mode: take the resolved source colours and canvas anchor,
 * generate the six scale families, derive the elevation surfaces, and apply the semantic map.
 * Rethrows a scale-level {@link ScaleGenerationError} as a {@link ThemeGenerationError} carrying
 * the families it had already resolved.
 */
function buildModeColors(mode: ColorMode, modeFoundation: ThemeModeFoundation): ModeColors {
	const source = modeFoundation.color;
	// The canvas anchor drives every family's ramp and the elevation surfaces alike, so a family's
	// subtle steps always ramp away from the same background the surfaces sit on.
	const canvasAnchor = source.background;

	const families = {} as Record<FamilyRole, ScaleFamily>;
	const familyDiagnostics = {} as Record<FamilyRole, FamilyDiagnostics>;
	// Generated in canonical role order, so a build that fails part-way reports the families it had
	// already resolved. Every role now guarantees on-solid, so any of the six can be the one that throws.
	for (const role of SEMANTIC_ROLES) {
		try {
			const generated = generateFamilyWithDiagnostics({
				background: canvasAnchor,
				mode,
				role,
				source: source[role],
			});
			families[role] = generated.family;
			familyDiagnostics[role] = generated.diagnostics;
		} catch (error) {
			if (error instanceof ScaleGenerationError) {
				throw new ThemeGenerationError(error, {
					completedFamilies: { ...familyDiagnostics },
					mode,
					role,
				});
			}
			throw error;
		}
	}

	const surfaces = generateSurfaces({ background: canvasAnchor, mode });
	const controlBorder = solveControlBorder({
		canvas: surfaces.canvas,
		mode,
		neutral: families.neutral,
		recessed: surfaces.recessed,
	});
	const colorValues = mapSemanticColors({
		controlBorder,
		families,
		focus: source.focus,
		backdrop: modeFoundation.color.backdrop,
		surfaces,
	});
	return { colorValues, familyDiagnostics, surfaces };
}

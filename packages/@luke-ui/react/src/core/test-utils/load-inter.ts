import interMetrics from '@capsizecss/metrics/inter';
import interUrl from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url';
import jetbrainsMonoUrl from '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2?url';

/** Inter's cap height as a fraction of its font size, from its published metrics. */
export const INTER_CAP_HEIGHT_EM = interMetrics.capHeight / interMetrics.unitsPerEm;

/** Family name registered for the pinned monospace face used in browser tests. */
export const PINNED_MONO_FAMILY = 'JetBrains Mono';

const PINNED_CODE_FAMILY_STYLE_ID = 'luke-ui-pinned-code-family';

let visualFontsPromise: Promise<void> | undefined;
let codeFamilyPinCount = 0;

/**
 * Loads the Inter and JetBrains Mono files the visual suite pins. Safe to call more than once:
 * later calls reuse the same load. Faces stay for the worker lifetime so mounts and captures share
 * metrics. Pair with `pinCodeFamily` so `--luke-font-family-code` resolves to the pinned face from
 * the first paint of a fixture.
 */
export async function loadVisualFonts(): Promise<void> {
	visualFontsPromise ??= loadVisualFontsOnce();
	await visualFontsPromise;
}

/**
 * Loads the pinned Inter face. Prefer `loadVisualFonts` when both body and code text matter; this
 * remains for Capsize tests that only need Inter metrics.
 */
export async function loadInter(): Promise<void> {
	await loadVisualFonts();
}

/**
 * Remaps `--luke-font-family-code` to the pinned mono face. Nested calls share one stylesheet;
 * each caller must invoke the returned restore exactly once. Browser setup pins before mount so
 * fixtures measure against JetBrains Mono; `captureVisual` may pin again as a safety net.
 */
export function pinCodeFamily(): () => void {
	if (codeFamilyPinCount === 0) {
		const style = document.createElement('style');
		style.id = PINNED_CODE_FAMILY_STYLE_ID;
		style.textContent = `
html {
	--luke-font-family-code: "${PINNED_MONO_FAMILY}", ui-monospace, monospace !important;
}
`;
		document.head.append(style);
	}
	codeFamilyPinCount += 1;

	let released = false;
	return () => {
		if (released) return;
		released = true;
		codeFamilyPinCount -= 1;
		if (codeFamilyPinCount === 0) {
			document.getElementById(PINNED_CODE_FAMILY_STYLE_ID)?.remove();
		}
	};
}

async function loadVisualFontsOnce(): Promise<void> {
	await Promise.all([
		ensureFace('Inter', interUrl, { style: 'normal', weight: '100 900' }),
		ensureFace(PINNED_MONO_FAMILY, jetbrainsMonoUrl, { style: 'normal', weight: '100 800' }),
	]);
	await Promise.all([
		document.fonts.load('16px Inter'),
		document.fonts.load(`16px "${PINNED_MONO_FAMILY}"`),
	]);
}

async function ensureFace(
	family: string,
	sourceUrl: string,
	descriptors: FontFaceDescriptors,
): Promise<FontFace> {
	const existing = [...document.fonts].find(
		(face) => face.family === family || face.family === `"${family}"`,
	);
	if (existing !== undefined) {
		if (existing.status !== 'loaded') await existing.loaded;
		return existing;
	}

	const face = new FontFace(family, `url(${sourceUrl})`, descriptors);
	document.fonts.add(face);
	// Rejects when the file cannot be fetched or decoded, so a test never measures a fallback font.
	await face.load();
	return face;
}

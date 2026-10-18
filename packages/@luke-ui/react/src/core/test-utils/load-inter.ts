import interMetrics from '@capsizecss/metrics/inter';
import interUrl from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url';
import jetbrainsMonoUrl from '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2?url';

/** Inter's cap height as a fraction of its font size, from its published metrics. */
export const INTER_CAP_HEIGHT_EM = interMetrics.capHeight / interMetrics.unitsPerEm;

/** Family name registered for the pinned monospace face used in browser tests. */
export const PINNED_MONO_FAMILY = 'JetBrains Mono';

const PINNED_CODE_RENDERING_STYLE_ID = 'luke-ui-pinned-code-rendering';

let visualFontsPromise: Promise<void> | undefined;

/**
 * Loads the Inter and JetBrains Mono files the visual suite pins. Safe to call more than once:
 * later calls reuse the same load. Faces stay for the worker lifetime so mounts and captures share
 * metrics. Pair with `pinCodeFontRendering` so code text paints with JetBrains Mono without remapping
 * `--luke-font-family-code`.
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
 * Pins code *rendering* to the loaded JetBrains Mono face without remapping
 * `--luke-font-family-code`. Token boards and theme tests can still read the production code stack
 * from that custom property. Browser setup owns the single pin for each test; call the returned
 * restore exactly once.
 */
export function pinCodeFontRendering(): () => void {
	if (document.getElementById(PINNED_CODE_RENDERING_STYLE_ID) !== null) {
		throw new Error('Code font rendering is already pinned for this document');
	}

	const style = document.createElement('style');
	style.id = PINNED_CODE_RENDERING_STYLE_ID;
	// Element font-family, not the theme token: `!important` beats inline `var(--luke-font-family-code)`
	// for painting while `getPropertyValue('--luke-font-family-code')` still returns the theme value.
	// `code` / `pre` / `samp` — not `kbd`, which must keep the body stack for product tests.
	// Also pin TokenBoard font.family.code TextSample spans (`fontFamily: var(--luke-font-family-code)`
	// on a non-code host); without this the preview still paints the host monospace stack.
	style.textContent = `
code, samp, pre,
[style*="--luke-font-family-code"] {
	font-family: "${PINNED_MONO_FAMILY}", ui-monospace, monospace !important;
}
`;
	document.head.append(style);

	let released = false;
	return () => {
		if (released) return;
		released = true;
		style.remove();
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

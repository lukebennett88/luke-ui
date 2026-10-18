import interMetrics from '@capsizecss/metrics/inter';
import interUrl from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url';
import { onTestFinished } from 'vite-plus/test';

/** Inter's cap height as a fraction of its font size, from its published metrics. */
export const INTER_CAP_HEIGHT_EM = interMetrics.capHeight / interMetrics.unitsPerEm;

let loadedFace: FontFace | undefined;

/**
 * Loads the Inter font file the theme packages ship for the rest of the current test. The fixture
 * themes name `Inter`, but `render()` loads no font on its own. Visual captures call this so text
 * rasterises from the pinned file rather than whichever Inter (or fallback) the machine has
 * installed. Layout tests that depend on Capsize metrics also call it and assert against
 * `INTER_CAP_HEIGHT_EM` and measured baselines, not against the CSS under test.
 *
 * Safe to call more than once in the same test: later calls reuse the loaded face.
 */
export async function loadInter(): Promise<void> {
	if (loadedFace !== undefined && [...document.fonts].includes(loadedFace)) {
		await document.fonts.load('16px Inter');
		return;
	}

	const face = new FontFace('Inter', `url(${interUrl})`, { style: 'normal', weight: '100 900' });
	document.fonts.add(face);
	loadedFace = face;
	onTestFinished(() => {
		document.fonts.delete(face);
		if (loadedFace === face) loadedFace = undefined;
	});
	// Rejects when the file cannot be fetched or decoded, so a test never measures a fallback font.
	await face.load();
	await document.fonts.load('16px Inter');
}

import interMetrics from '@capsizecss/metrics/inter';
import interUrl from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url';
import { onTestFinished } from 'vite-plus/test';

/** Inter's cap height as a fraction of its font size, from its published metrics. */
export const INTER_CAP_HEIGHT_EM = interMetrics.capHeight / interMetrics.unitsPerEm;

/**
 * Loads the Inter font file the theme packages ship for the rest of the current test. The fixture
 * themes name `Inter`, but `render()` loads no font, so text falls back to a system font. Use this
 * when a layout depends on real font metrics, such as Capsize trims or the cap height. Assert
 * against `INTER_CAP_HEIGHT_EM` and measured baselines, not against the CSS under test.
 */
export async function loadInter(): Promise<void> {
	const face = new FontFace('Inter', `url(${interUrl})`, { style: 'normal', weight: '100 900' });
	document.fonts.add(face);
	onTestFinished(() => {
		document.fonts.delete(face);
	});
	// Rejects when the file cannot be fetched or decoded, so a test never measures a fallback font.
	await face.load();
}

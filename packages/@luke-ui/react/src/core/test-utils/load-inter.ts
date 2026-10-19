import interMetrics from '@capsizecss/metrics/inter';
import interUrl from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url';

/** Inter's cap height as a fraction of its font size, from its published metrics. */
export const INTER_CAP_HEIGHT_EM = interMetrics.capHeight / interMetrics.unitsPerEm;

let interPromise: Promise<void> | undefined;

/**
 * Loads the Inter file the theme packages ship. Safe to call more than once: later calls reuse the
 * same load. The face stays for the worker lifetime so mounts and captures share metrics. Browser
 * setup awaits this before each test mounts; `captureVisual` awaits it again so a capture still
 * waits if setup was skipped. Metric-sensitive Capsize tests can also call it directly.
 */
export async function loadInter(): Promise<void> {
	interPromise ??= loadInterOnce();
	await interPromise;
}

async function loadInterOnce(): Promise<void> {
	const existing = [...document.fonts].find(
		(face) => face.family === 'Inter' || face.family === '"Inter"',
	);
	if (existing !== undefined) {
		if (existing.status !== 'loaded') await existing.loaded;
	} else {
		const face = new FontFace('Inter', `url(${interUrl})`, {
			style: 'normal',
			weight: '100 900',
		});
		document.fonts.add(face);
		// Rejects when the file cannot be fetched or decoded, so a test never measures a fallback font.
		await face.load();
	}
	await document.fonts.load('16px Inter');
}

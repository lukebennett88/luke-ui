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

/**
 * Clears the memo so a test can exercise a fresh load. Production code must not call this.
 */
export function resetLoadInterMemoForTests(): void {
	interPromise = undefined;
}

async function loadInterOnce(): Promise<void> {
	// Always register and load the theme package file. An existing `Inter` face may be unloaded
	// (awaiting `.loaded` without calling `.load()` hangs) or point at a different binary.
	// Load only this face: `document.fonts.load('… Inter')` would also try to load other Inter
	// faces and can hang or fail on an unloaded or broken registration.
	const face = new FontFace('Inter', `url(${interUrl})`, {
		style: 'normal',
		weight: '100 900',
	});
	document.fonts.add(face);
	// Rejects when the file cannot be fetched or decoded, so a test never measures a fallback font.
	await face.load();
	if (!document.fonts.check('16px Inter')) {
		throw new Error('Inter did not become available after loading the theme font file.');
	}
}

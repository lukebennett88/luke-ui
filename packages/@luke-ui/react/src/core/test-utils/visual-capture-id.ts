const VIEWPORT_MARKER = '__viewport-';
const VIEWPORT_SIZE = /^(\d+)x(\d+)$/;

export type VisualCaptureIdentity = {
	id: string;
	viewport: string;
	viewportHeight: number;
	viewportWidth: number;
};

/** Viewport token written into a capture name, for example `1024x800`. */
export function formatVisualViewport(width: number, height: number): string {
	return `${width}x${height}`;
}

/** Capture name without extension: `{id}__viewport-{width}x{height}`. */
export function formatVisualCaptureName(id: string, viewport: string): string {
	return `${id}${VIEWPORT_MARKER}${viewport}`;
}

/**
 * Reads the capture name written by `formatVisualCaptureName`. Returns `undefined` when
 * the name has no trailing `{width}x{height}` viewport token, including legacy captures.
 */
export function parseVisualCaptureIdentity(captureName: string): VisualCaptureIdentity | undefined {
	const index = captureName.lastIndexOf(VIEWPORT_MARKER);
	if (index === -1) return undefined;

	const id = captureName.slice(0, index);
	const viewport = captureName.slice(index + VIEWPORT_MARKER.length);
	const size = viewport.match(VIEWPORT_SIZE);
	const width = size?.[1];
	const height = size?.[2];
	if (width === undefined || height === undefined) return undefined;

	return {
		id,
		viewport,
		viewportHeight: Number(height),
		viewportWidth: Number(width),
	};
}

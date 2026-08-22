export type ExamplePreviewHeightMessage = {
	height: number;
	type: 'example-preview:height';
};

export const EXAMPLE_PREVIEW_MINIMUM_HEIGHT = 96;

export function isExamplePreviewHeightMessage(
	message: unknown,
): message is ExamplePreviewHeightMessage {
	if (typeof message !== 'object' || message === null) return false;

	const { height, type } = message as Record<string, unknown>;
	return (
		type === 'example-preview:height' &&
		typeof height === 'number' &&
		Number.isSafeInteger(height) &&
		height >= EXAMPLE_PREVIEW_MINIMUM_HEIGHT
	);
}

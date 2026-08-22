import { z } from 'zod';

export const EXAMPLE_PREVIEW_MINIMUM_HEIGHT = 96;

const requestHeightMessageSchema = z.object({
	type: z.literal('example-preview:request-height'),
});

const appearanceMessageSchema = z.object({
	colorMode: z.enum(['light', 'dark', 'system']),
	themeIdentity: z.enum(['tactile', 'paper']),
	type: z.literal('example-preview:appearance'),
});

const parentMessageSchema = z.discriminatedUnion('type', [
	requestHeightMessageSchema,
	appearanceMessageSchema,
]);

const heightMessageSchema = z.object({
	height: z.number().int().safe().min(EXAMPLE_PREVIEW_MINIMUM_HEIGHT),
	type: z.literal('example-preview:height'),
});

const previewMessageSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('example-preview:ready') }),
	heightMessageSchema,
	z.object({ message: z.string(), type: z.literal('example-preview:error') }),
]);

export type ExamplePreviewAppearanceMessage = z.infer<typeof appearanceMessageSchema>;
export type ExamplePreviewParentMessage = z.infer<typeof parentMessageSchema>;
export type ExamplePreviewPreviewMessage = z.infer<typeof previewMessageSchema>;

export function isExamplePreviewHeightMessage(
	message: unknown,
): message is z.infer<typeof heightMessageSchema> {
	return heightMessageSchema.safeParse(message).success;
}

export function isExamplePreviewParentMessage(
	message: unknown,
): message is ExamplePreviewParentMessage {
	return parentMessageSchema.safeParse(message).success;
}

export function isExamplePreviewPreviewMessage(
	message: unknown,
): message is ExamplePreviewPreviewMessage {
	return previewMessageSchema.safeParse(message).success;
}

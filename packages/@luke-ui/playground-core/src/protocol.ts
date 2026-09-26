import * as z from 'zod';

const codeMessageSchema = z.object({
	code: z.string(),
	type: z.literal('playground:code'),
});

const appearanceMessageSchema = z.object({
	colorMode: z.enum(['light', 'dark', 'system']),
	themeIdentity: z.enum(['tactile', 'paper']),
	type: z.literal('playground:appearance'),
});

const parentMessageSchema = z.discriminatedUnion('type', [
	codeMessageSchema,
	appearanceMessageSchema,
]);

const previewMessageSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('playground:ready') }),
	z.object({ type: z.literal('playground:success') }),
	z.object({ message: z.string(), type: z.literal('playground:error') }),
]);

export type PlaygroundCodeMessage = z.infer<typeof codeMessageSchema>;
export type PlaygroundAppearanceMessage = z.infer<typeof appearanceMessageSchema>;
export type PlaygroundParentMessage = z.infer<typeof parentMessageSchema>;
export type PlaygroundPreviewMessage = z.infer<typeof previewMessageSchema>;

export function isPlaygroundParentMessage(data: unknown): data is PlaygroundParentMessage {
	return parentMessageSchema.safeParse(data).success;
}

export function isPlaygroundPreviewMessage(data: unknown): data is PlaygroundPreviewMessage {
	return previewMessageSchema.safeParse(data).success;
}

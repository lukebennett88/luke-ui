import { z } from 'zod';

const codeMessageSchema = z.object({
	type: z.literal('playground:code'),
	code: z.string(),
});

const appearanceMessageSchema = z.object({
	type: z.literal('playground:appearance'),
	colorMode: z.enum(['light', 'dark', 'system']),
	themeIdentity: z.enum(['machined-edge', 'elmo']),
});

const parentMessageSchema = z.discriminatedUnion('type', [
	codeMessageSchema,
	appearanceMessageSchema,
]);

const previewMessageSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('playground:ready') }),
	z.object({ type: z.literal('playground:success') }),
	z.object({ type: z.literal('playground:error'), message: z.string() }),
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

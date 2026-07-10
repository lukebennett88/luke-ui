import { z } from 'zod';

const codeMessageSchema = z.object({
	type: z.literal('playground:code'),
	code: z.string(),
});

const previewMessageSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('playground:ready') }),
	z.object({ type: z.literal('playground:success') }),
	z.object({ type: z.literal('playground:error'), message: z.string() }),
]);

export type PlaygroundCodeMessage = z.infer<typeof codeMessageSchema>;
export type PlaygroundPreviewMessage = z.infer<typeof previewMessageSchema>;

export function isPlaygroundCodeMessage(data: unknown): data is PlaygroundCodeMessage {
	return codeMessageSchema.safeParse(data).success;
}

export function isPlaygroundPreviewMessage(data: unknown): data is PlaygroundPreviewMessage {
	return previewMessageSchema.safeParse(data).success;
}

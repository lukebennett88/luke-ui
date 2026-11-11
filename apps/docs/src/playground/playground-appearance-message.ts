/**
 * The docs playground's theme message. The playground page posts it to the
 * preview iframe on a theme change and when the preview announces ready, and
 * the preview mirrors it into its own document. It is a docs message rather
 * than a `@luke-ui/playground-core` one because the theme model belongs to the
 * docs site.
 */
import type { PlaygroundPagePorts } from '@luke-ui/playground-core/protocol';
import * as z from 'zod';

const appearanceMessageSchema = z.object({
	colorMode: z.enum(['light', 'dark', 'system']),
	themeIdentity: z.enum(['tactile', 'paper']),
	type: z.literal('luke-ui-docs:appearance'),
});

export type PlaygroundAppearanceMessage = z.infer<typeof appearanceMessageSchema>;
export type PlaygroundAppearance = Omit<PlaygroundAppearanceMessage, 'type'>;

export function isPlaygroundAppearanceMessage(data: unknown): data is PlaygroundAppearanceMessage {
	return appearanceMessageSchema.safeParse(data).success;
}

/** Posts the appearance to the preview iframe, if it exists yet. */
export function postPlaygroundAppearance(
	appearance: PlaygroundAppearance,
	ports: PlaygroundPagePorts,
): void {
	if (!ports.previewWindow) return;
	const message: PlaygroundAppearanceMessage = { ...appearance, type: 'luke-ui-docs:appearance' };
	ports.previewWindow.postMessage(message, ports.origin);
}

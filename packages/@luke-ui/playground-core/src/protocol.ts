import * as z from 'zod';

/**
 * Message schemas, trust checks, and the page-side handshake session shared by a
 * playground page and its preview iframe.
 *
 * Core owns only the code/result round trip. A host that needs more messages,
 * such as theme updates, defines its own schema and validates it with
 * {@link isTrustedMessageSource} so it gets the same origin and source check.
 */

const codeMessageSchema = z.object({
	code: z.string(),
	type: z.literal('playground:code'),
});

const previewMessageSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('playground:ready') }),
	z.object({ type: z.literal('playground:success') }),
	z.object({ message: z.string(), type: z.literal('playground:error') }),
]);

export type PlaygroundCodeMessage = z.infer<typeof codeMessageSchema>;
export type PlaygroundParentMessage = PlaygroundCodeMessage;
export type PlaygroundPreviewMessage = z.infer<typeof previewMessageSchema>;

export type PlaygroundMessageEvent = {
	data: unknown;
	origin: string;
	source: unknown;
};

export type PlaygroundPagePorts = {
	origin: string;
	previewWindow: PlaygroundMessagePort | null;
};

export type PlaygroundPageHandlers = {
	currentCode: string;
	onError: (message: string) => void;
	onReady: () => void;
	/**
	 * Runs when the preview announces `playground:ready`, before the session
	 * replays `currentCode`. Post host messages here that the preview needs
	 * before it renders code.
	 */
	onPreviewReady?: (ports: PlaygroundPagePorts) => void;
	onSuccess: () => void;
};

type PlaygroundMessagePort = {
	postMessage: (message: unknown, targetOrigin: string) => void;
};

export function isPlaygroundParentMessage(data: unknown): data is PlaygroundParentMessage {
	return codeMessageSchema.safeParse(data).success;
}

export function isPlaygroundPreviewMessage(data: unknown): data is PlaygroundPreviewMessage {
	return previewMessageSchema.safeParse(data).success;
}

/**
 * True when a message came from the expected window on the expected origin.
 * It does not inspect `event.data`, so pair it with a schema check.
 */
export function isTrustedMessageSource(
	event: PlaygroundMessageEvent,
	origin: string,
	source: unknown,
): boolean {
	return event.origin === origin && event.source === source;
}

/** True when a preview message came from the playground page that owns this iframe. */
export function isTrustedParentMessage(
	event: PlaygroundMessageEvent,
	origin: string,
	parent: unknown,
): event is PlaygroundMessageEvent & { data: PlaygroundParentMessage } {
	return isTrustedMessageSource(event, origin, parent) && isPlaygroundParentMessage(event.data);
}

/**
 * Owns when the playground page may talk to its preview, and what it does with
 * a preview reply. Compilation, the URL hash, and debounce stay in the host.
 */
export function createPlaygroundPageSession() {
	let ready = false;

	function postCode(
		code: string,
		ports: PlaygroundPagePorts,
		options?: { unguarded?: boolean },
	): void {
		if (!ports.previewWindow) return;
		// Unguarded posts cover a missed `playground:ready` (fast iframe, slow page listener).
		if (!options?.unguarded && !ready) return;
		const message: PlaygroundCodeMessage = { code, type: 'playground:code' };
		ports.previewWindow.postMessage(message, ports.origin);
	}

	function handlePreviewMessage(
		event: PlaygroundMessageEvent,
		ports: PlaygroundPagePorts,
		handlers: PlaygroundPageHandlers,
	): void {
		if (!isTrustedPreviewMessage(event, ports.origin, ports.previewWindow)) return;
		ready = true;
		handlers.onReady();
		if (event.data.type === 'playground:ready') {
			handlers.onPreviewReady?.(ports);
			postCode(handlers.currentCode, ports);
			return;
		}
		if (event.data.type === 'playground:error') {
			handlers.onError(event.data.message);
			return;
		}
		handlers.onSuccess();
	}

	return {
		handlePreviewMessage,
		get isReady() {
			return ready;
		},
		postCode,
	};
}

/** True when a page message came from this playground's preview iframe. */
function isTrustedPreviewMessage(
	event: PlaygroundMessageEvent,
	origin: string,
	preview: unknown,
): event is PlaygroundMessageEvent & { data: PlaygroundPreviewMessage } {
	return isTrustedMessageSource(event, origin, preview) && isPlaygroundPreviewMessage(event.data);
}

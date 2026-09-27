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

type PlaygroundCodeMessage = z.infer<typeof codeMessageSchema>;
export type PlaygroundPreviewMessage = z.infer<typeof previewMessageSchema>;

/** The subset of `MessageEvent` a trust check needs — enough to fake in a test. */
export type PlaygroundMessageEvent = {
	data: unknown;
	origin: string;
	source: unknown;
};

export type PlaygroundPagePorts = {
	origin: string;
	previewWindow: PlaygroundMessagePort | null;
};

/** The result a page session reports through `onResult`. */
export type PlaygroundResult = { type: 'success' } | { type: 'error'; message: string };

type PlaygroundMessagePort = {
	postMessage: (message: unknown, targetOrigin: string) => void;
};

export function isPlaygroundCodeMessage(data: unknown): data is PlaygroundCodeMessage {
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

export type CreatePlaygroundPageSessionOptions = {
	/** Returns the current ports, so the host can reflect live ref values. */
	getPorts: () => PlaygroundPagePorts;
	/** Returns the code to (re)send to the preview. */
	getCode: () => string;
	/**
	 * Runs when the preview announces `playground:ready`, before the session
	 * replays the current code. Post host messages here that the preview needs
	 * before it renders code.
	 */
	onPreviewReady?: (ports: PlaygroundPagePorts) => void;
	/** Runs for a `playground:success` or `playground:error` message from the preview. */
	onResult: (result: PlaygroundResult) => void;
};

export type PlaygroundPageSession = {
	/** Handles a trusted `message` event from `window`. Ignores anything else. */
	handleMessage: (event: PlaygroundMessageEvent) => void;
	/** Posts `code` to the preview. A no-op until the preview has sent any trusted message. */
	postCode: (code: string) => void;
	/** Posts the current code even before the preview has announced ready, covering a missed `playground:ready` (fast iframe, slow page listener). */
	resync: () => void;
};

/**
 * Owns when the playground page may talk to its preview, and what it does
 * with a preview reply. Compilation, the URL hash, and debounce stay in the
 * host.
 */
export function createPlaygroundPageSession(
	options: CreatePlaygroundPageSessionOptions,
): PlaygroundPageSession {
	let ready = false;

	function postCode(code: string): void {
		if (!ready) return;
		sendCode(code);
	}

	/**
	 * Also covers a missed `playground:ready`: if the preview announced ready
	 * before the page's message listener attached, this sends the code anyway,
	 * and the preview's reply to it (a success or error, not a second `ready`)
	 * is what `handleMessage` sees first and uses to flip `ready` to `true`.
	 */
	function resync(): void {
		sendCode(options.getCode());
	}

	function sendCode(code: string): void {
		const ports = options.getPorts();
		if (!ports.previewWindow) return;
		const message: PlaygroundCodeMessage = { code, type: 'playground:code' };
		ports.previewWindow.postMessage(message, ports.origin);
	}

	function handleMessage(event: PlaygroundMessageEvent): void {
		const ports = options.getPorts();
		if (!isTrustedPreviewMessage(event, ports.origin, ports.previewWindow)) return;

		// Any trusted reply means the preview is live.
		ready = true;

		if (event.data.type === 'playground:ready') {
			options.onPreviewReady?.(ports);
			resync();
			return;
		}
		if (event.data.type === 'playground:error') {
			options.onResult({ message: event.data.message, type: 'error' });
			return;
		}
		options.onResult({ type: 'success' });
	}

	return { handleMessage, postCode, resync };
}

/** True when a page message came from this playground's preview iframe. */
function isTrustedPreviewMessage(
	event: PlaygroundMessageEvent,
	origin: string,
	preview: unknown,
): event is PlaygroundMessageEvent & { data: PlaygroundPreviewMessage } {
	return isTrustedMessageSource(event, origin, preview) && isPlaygroundPreviewMessage(event.data);
}

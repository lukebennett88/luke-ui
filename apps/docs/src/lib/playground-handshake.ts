import type {
	PlaygroundAppearanceMessage,
	PlaygroundCodeMessage,
	PlaygroundParentMessage,
	PlaygroundPreviewMessage,
} from './playground-protocol.js';
import { isPlaygroundParentMessage, isPlaygroundPreviewMessage } from './playground-protocol.js';

type PlaygroundMessagePort = {
	postMessage: (message: unknown, targetOrigin: string) => void;
};

export type PlaygroundMessageEvent = {
	data: unknown;
	origin: string;
	source: unknown;
};

export type PlaygroundPagePorts = {
	origin: string;
	previewWindow: PlaygroundMessagePort | null;
};

type PlaygroundPageHandlers = {
	appearance: Omit<PlaygroundAppearanceMessage, 'type'> | null;
	currentCode: string;
	onError: (message: string) => void;
	onReady: () => void;
	onSuccess: () => void;
};

/** True when a preview message came from the playground page that owns this iframe. */
export function isTrustedParentMessage(
	event: PlaygroundMessageEvent,
	origin: string,
	parent: unknown,
): event is PlaygroundMessageEvent & { data: PlaygroundParentMessage } {
	return (
		event.origin === origin && event.source === parent && isPlaygroundParentMessage(event.data)
	);
}

/** True when a page message came from this playground's preview iframe. */
function isTrustedPreviewMessage(
	event: PlaygroundMessageEvent,
	origin: string,
	preview: unknown,
): event is PlaygroundMessageEvent & { data: PlaygroundPreviewMessage } {
	return (
		event.origin === origin && event.source === preview && isPlaygroundPreviewMessage(event.data)
	);
}

/**
 * Owns when the playground page may talk to its preview, and what it does with
 * a preview reply. Compilation, the URL hash, and debounce stay in the route.
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

	function postAppearance(
		appearance: Omit<PlaygroundAppearanceMessage, 'type'>,
		ports: PlaygroundPagePorts,
	): void {
		if (!ports.previewWindow) return;
		const message: PlaygroundAppearanceMessage = { ...appearance, type: 'playground:appearance' };
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
			if (handlers.appearance !== null) postAppearance(handlers.appearance, ports);
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
		postAppearance,
		postCode,
	};
}

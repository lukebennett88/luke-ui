import type {
	ExamplePreviewAppearanceMessage,
	ExamplePreviewParentMessage,
	ExamplePreviewPreviewMessage,
} from './example-preview-protocol.js';
import {
	isExamplePreviewParentMessage,
	isExamplePreviewPreviewMessage,
} from './example-preview-protocol.js';

type ExamplePreviewMessagePort = {
	postMessage: (message: unknown, targetOrigin: string) => void;
};

export type ExamplePreviewMessageEvent = {
	data: unknown;
	origin: string;
	source: unknown;
};

export type ExamplePreviewPagePorts = {
	origin: string;
	previewWindow: ExamplePreviewMessagePort | null;
};

type ExamplePreviewPageHandlers = {
	appearance: Omit<ExamplePreviewAppearanceMessage, 'type'> | null;
	onError: (message: string) => void;
	onHeight: (height: number) => void;
};

export function isTrustedExamplePreviewParentMessage(
	event: ExamplePreviewMessageEvent,
	origin: string,
	parent: unknown,
): event is ExamplePreviewMessageEvent & { data: ExamplePreviewParentMessage } {
	return (
		event.origin === origin && event.source === parent && isExamplePreviewParentMessage(event.data)
	);
}

function isTrustedExamplePreviewMessage(
	event: ExamplePreviewMessageEvent,
	origin: string,
	preview: unknown,
): event is ExamplePreviewMessageEvent & { data: ExamplePreviewPreviewMessage } {
	return (
		event.origin === origin &&
		event.source === preview &&
		isExamplePreviewPreviewMessage(event.data)
	);
}

export function createExamplePreviewPageSession() {
	function requestHeight(ports: ExamplePreviewPagePorts): void {
		ports.previewWindow?.postMessage({ type: 'example-preview:request-height' }, ports.origin);
	}

	function postAppearance(
		appearance: Omit<ExamplePreviewAppearanceMessage, 'type'>,
		ports: ExamplePreviewPagePorts,
	): void {
		if (!ports.previewWindow) return;

		const message: ExamplePreviewAppearanceMessage = {
			...appearance,
			type: 'example-preview:appearance',
		};
		ports.previewWindow.postMessage(message, ports.origin);
	}

	function handlePreviewMessage(
		event: ExamplePreviewMessageEvent,
		ports: ExamplePreviewPagePorts,
		handlers: ExamplePreviewPageHandlers,
	): void {
		if (!isTrustedExamplePreviewMessage(event, ports.origin, ports.previewWindow)) return;

		switch (event.data.type) {
			case 'example-preview:ready': {
				if (handlers.appearance !== null) postAppearance(handlers.appearance, ports);
				requestHeight(ports);
				return;
			}
			case 'example-preview:height': {
				handlers.onHeight(event.data.height);
				return;
			}
			case 'example-preview:error': {
				handlers.onError(event.data.message);
			}
		}
	}

	return { handlePreviewMessage, postAppearance, requestHeight };
}

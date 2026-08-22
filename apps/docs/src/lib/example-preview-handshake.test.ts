import { expect, test } from 'vite-plus/test';
import {
	createExamplePreviewPageSession,
	isTrustedExamplePreviewParentMessage,
} from './example-preview-handshake.js';
import type {
	ExamplePreviewMessageEvent,
	ExamplePreviewPagePorts,
} from './example-preview-handshake.js';

const ORIGIN = 'https://docs.test';

type MessageBus = {
	listenPage: (listener: (event: ExamplePreviewMessageEvent) => void) => void;
	listenPreview: (listener: (event: ExamplePreviewMessageEvent) => void) => void;
	page: object;
	ports: ExamplePreviewPagePorts;
	postFromPreview: (data: unknown) => void;
};

function createMessageBus(): MessageBus {
	const page = { role: 'page' };
	let pageListener: ((event: ExamplePreviewMessageEvent) => void) | undefined;
	let previewListener: ((event: ExamplePreviewMessageEvent) => void) | undefined;

	const previewWindow = {
		postMessage(data: unknown, targetOrigin: string) {
			if (targetOrigin !== ORIGIN) return;
			previewListener?.({ data, origin: ORIGIN, source: page });
		},
	};

	return {
		listenPage(listener) {
			pageListener = listener;
		},
		listenPreview(listener) {
			previewListener = listener;
		},
		page,
		ports: { origin: ORIGIN, previewWindow },
		postFromPreview(data) {
			pageListener?.({ data, origin: ORIGIN, source: previewWindow });
		},
	};
}

test('recovers the preview height when the initial report arrived before the page listened', () => {
	const bus = createMessageBus();
	const heights: Array<number> = [];
	const session = createExamplePreviewPageSession();

	bus.listenPreview((event) => {
		if (!isTrustedExamplePreviewParentMessage(event, ORIGIN, bus.page)) return;
		if (event.data.type !== 'example-preview:request-height') return;

		bus.postFromPreview({ height: 240, type: 'example-preview:height' });
	});
	bus.postFromPreview({ height: 240, type: 'example-preview:height' });

	bus.listenPage((event) => {
		session.handlePreviewMessage(event, bus.ports, {
			appearance: null,
			onError: () => {},
			onHeight: (height) => heights.push(height),
		});
	});
	// The page requests the current value after attaching its listener, so it
	// does not depend on receiving the iframe's initial ready or height messages.
	session.requestHeight(bus.ports);

	expect(heights).toEqual([240]);
});

test('requests the current height when the preview announces that it is ready', () => {
	const bus = createMessageBus();
	const heights: Array<number> = [];
	const session = createExamplePreviewPageSession();

	bus.listenPreview((event) => {
		if (!isTrustedExamplePreviewParentMessage(event, ORIGIN, bus.page)) return;
		if (event.data.type !== 'example-preview:request-height') return;

		bus.postFromPreview({ height: 320, type: 'example-preview:height' });
	});
	bus.listenPage((event) => {
		session.handlePreviewMessage(event, bus.ports, {
			appearance: null,
			onError: () => {},
			onHeight: (height) => heights.push(height),
		});
	});
	bus.postFromPreview({ type: 'example-preview:ready' });

	expect(heights).toEqual([320]);
});

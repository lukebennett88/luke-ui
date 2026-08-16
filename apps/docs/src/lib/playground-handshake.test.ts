import { expect, test } from 'vite-plus/test';
import { createPlaygroundPageSession, isTrustedParentMessage } from './playground-handshake.js';
import type { PlaygroundMessageEvent, PlaygroundPagePorts } from './playground-handshake.js';

const ORIGIN = 'https://docs.test';
const VALID_CODE = 'export default function Preview() { return null; }';

type MessageBus = {
	listenPage: (listener: (event: PlaygroundMessageEvent) => void) => void;
	listenPreview: (listener: (event: PlaygroundMessageEvent) => void) => void;
	page: object;
	ports: PlaygroundPagePorts;
	postFromPreview: (data: unknown, source?: object) => void;
};

function createMessageBus(): MessageBus {
	const page = { role: 'page' };
	let pageListener: ((event: PlaygroundMessageEvent) => void) | undefined;
	let previewListener: ((event: PlaygroundMessageEvent) => void) | undefined;

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
		postFromPreview(data, source = previewWindow) {
			pageListener?.({ data, origin: ORIGIN, source });
		},
	};
}

function attachFakePreview(
	bus: MessageBus,
	compile: (code: string) => { message: string; ok: false } | { ok: true },
): void {
	bus.listenPreview((event) => {
		if (!isTrustedParentMessage(event, ORIGIN, bus.page)) return;
		if (event.data.type !== 'playground:code') return;
		const result = compile(event.data.code);
		if (result.ok) {
			bus.postFromPreview({ type: 'playground:success' });
			return;
		}
		bus.postFromPreview({ message: result.message, type: 'playground:error' });
	});
	bus.postFromPreview({ type: 'playground:ready' });
}

test('sends code and gets a result when the preview announced itself first', () => {
	const bus = createMessageBus();
	const results: Array<string> = [];
	attachFakePreview(bus, () => ({ ok: true }));

	const session = createPlaygroundPageSession();
	bus.listenPage((event) => {
		session.handlePreviewMessage(event, bus.ports, {
			appearance: null,
			currentCode: VALID_CODE,
			onError: (message) => results.push(message),
			onReady: () => {},
			onSuccess: () => results.push('success'),
		});
	});
	session.postCode(VALID_CODE, bus.ports, { unguarded: true });

	expect(results).toEqual(['success']);
	expect(session.isReady).toBe(true);
});

test('surfaces a compilation error from the preview', () => {
	const bus = createMessageBus();
	const results: Array<string> = [];
	const compileError = 'Playground code must default-export a React component.';
	attachFakePreview(bus, () => ({ message: compileError, ok: false }));

	const session = createPlaygroundPageSession();
	bus.listenPage((event) => {
		session.handlePreviewMessage(event, bus.ports, {
			appearance: null,
			currentCode: 'const broken = true;',
			onError: (message) => results.push(message),
			onReady: () => {},
			onSuccess: () => results.push('success'),
		});
	});
	session.postCode('const broken = true;', bus.ports, { unguarded: true });

	expect(results).toEqual([compileError]);
});

test('replays appearance and code when the preview announces ready', () => {
	const posted: Array<unknown> = [];
	const previewWindow = {
		postMessage(data: unknown) {
			posted.push(data);
		},
	};
	const session = createPlaygroundPageSession();

	session.handlePreviewMessage(
		{ data: { type: 'playground:ready' }, origin: ORIGIN, source: previewWindow },
		{ origin: ORIGIN, previewWindow },
		{
			appearance: { colorMode: 'dark', themeIdentity: 'paper' },
			currentCode: VALID_CODE,
			onError: () => {},
			onReady: () => {},
			onSuccess: () => {},
		},
	);

	expect(posted).toEqual([
		{ colorMode: 'dark', themeIdentity: 'paper', type: 'playground:appearance' },
		{ code: VALID_CODE, type: 'playground:code' },
	]);
});

test('drops code until the preview has spoken, unless the post is unguarded', () => {
	const posted: Array<unknown> = [];
	const previewWindow = {
		postMessage(data: unknown) {
			posted.push(data);
		},
	};
	const session = createPlaygroundPageSession();
	const ports = { origin: ORIGIN, previewWindow };

	session.postCode(VALID_CODE, ports);
	expect(posted).toEqual([]);

	session.postCode(VALID_CODE, ports, { unguarded: true });
	expect(posted).toEqual([{ code: VALID_CODE, type: 'playground:code' }]);
});

test('ignores a same-origin message from a frame that is not the preview', () => {
	const session = createPlaygroundPageSession();
	let called = false;
	const previewWindow = { postMessage: () => {} };

	session.handlePreviewMessage(
		{ data: { type: 'playground:success' }, origin: ORIGIN, source: { role: 'other' } },
		{ origin: ORIGIN, previewWindow },
		{
			appearance: null,
			currentCode: VALID_CODE,
			onError: () => {
				called = true;
			},
			onReady: () => {
				called = true;
			},
			onSuccess: () => {
				called = true;
			},
		},
	);

	expect(called).toBe(false);
	expect(session.isReady).toBe(false);
});

test('preview ignores a same-origin message that is not from its parent', () => {
	const parent = { role: 'parent' };
	const other = { role: 'other' };
	const code = { code: VALID_CODE, type: 'playground:code' };

	expect(
		isTrustedParentMessage({ data: code, origin: ORIGIN, source: parent }, ORIGIN, parent),
	).toBe(true);
	expect(
		isTrustedParentMessage({ data: code, origin: ORIGIN, source: other }, ORIGIN, parent),
	).toBe(false);
});

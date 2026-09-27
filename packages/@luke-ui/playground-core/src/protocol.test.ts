import { expect, test } from 'vite-plus/test';
import {
	createPlaygroundPageSession,
	isPlaygroundCodeMessage,
	isTrustedMessageSource,
} from './protocol.js';
import type {
	CreatePlaygroundPageSessionOptions,
	PlaygroundMessageEvent,
	PlaygroundPagePorts,
	PlaygroundPageSession,
	PlaygroundResult,
} from './protocol.js';

const ORIGIN = 'https://docs.test';
const VALID_CODE = 'export default function Preview() { return null; }';

type MessageBus = {
	listenPage: (listener: (event: PlaygroundMessageEvent) => void) => void;
	listenPreview: (listener: (event: PlaygroundMessageEvent) => void) => void;
	pageWindow: object;
	ports: PlaygroundPagePorts;
	postFromPreview: (data: unknown, source?: object) => void;
};

function createMessageBus(): MessageBus {
	const pageWindow = { role: 'page' };
	let pageListener: ((event: PlaygroundMessageEvent) => void) | undefined;
	let previewListener: ((event: PlaygroundMessageEvent) => void) | undefined;

	const previewWindow = {
		postMessage(data: unknown, targetOrigin: string) {
			if (targetOrigin !== ORIGIN) return;
			previewListener?.({ data, origin: ORIGIN, source: pageWindow });
		},
	};

	return {
		listenPage(listener) {
			pageListener = listener;
		},
		listenPreview(listener) {
			previewListener = listener;
		},
		pageWindow,
		ports: { origin: ORIGIN, previewWindow },
		postFromPreview(data, source = previewWindow) {
			pageListener?.({ data, origin: ORIGIN, source });
		},
	};
}

/** Mirrors the trust check `preview-runner.tsx` applies before the schema. */
function attachFakePreview(
	bus: MessageBus,
	compile: (code: string) => { message: string; ok: false } | { ok: true },
): void {
	bus.listenPreview((event) => {
		if (!isTrustedMessageSource(event, ORIGIN, bus.pageWindow)) return;
		if (!isPlaygroundCodeMessage(event.data)) return;
		const result = compile(event.data.code);
		if (result.ok) {
			bus.postFromPreview({ type: 'playground:success' });
			return;
		}
		bus.postFromPreview({ message: result.message, type: 'playground:error' });
	});
	bus.postFromPreview({ type: 'playground:ready' });
}

/** Creates a session over a recording `previewWindow.postMessage` and `onResult`. */
function createRecordingSession(overrides?: Partial<CreatePlaygroundPageSessionOptions>): {
	posted: Array<unknown>;
	previewWindow: { postMessage: (data: unknown) => void };
	results: Array<PlaygroundResult>;
	session: PlaygroundPageSession;
} {
	const posted: Array<unknown> = [];
	const previewWindow = {
		postMessage(data: unknown) {
			posted.push(data);
		},
	};
	const results: Array<PlaygroundResult> = [];

	const session = createPlaygroundPageSession({
		getCode: () => VALID_CODE,
		getPorts: () => ({ origin: ORIGIN, previewWindow }),
		onResult: (result) => results.push(result),
		...overrides,
	});

	return { posted, previewWindow, results, session };
}

test('on ready, runs onPreviewReady before posting code, in that order', () => {
	const { posted, previewWindow, session } = createRecordingSession({
		onPreviewReady: (ports) => {
			ports.previewWindow?.postMessage({ type: 'host:appearance' }, ports.origin);
		},
	});

	session.handleMessage({
		data: { type: 'playground:ready' },
		origin: ORIGIN,
		source: previewWindow,
	});

	expect(posted).toEqual([
		{ type: 'host:appearance' },
		{ code: VALID_CODE, type: 'playground:code' },
	]);
});

test('postCode is dropped before ready and sent after', () => {
	const { posted, previewWindow, session } = createRecordingSession();

	session.postCode(VALID_CODE);
	expect(posted).toEqual([]);

	session.handleMessage({
		data: { type: 'playground:ready' },
		origin: ORIGIN,
		source: previewWindow,
	});
	posted.length = 0;

	session.postCode('export default function Other() { return null; }');
	expect(posted).toEqual([
		{ code: 'export default function Other() { return null; }', type: 'playground:code' },
	]);
});

test('resync sends the current code even before ready', () => {
	const { posted, session } = createRecordingSession();

	session.resync();
	expect(posted).toEqual([{ code: VALID_CODE, type: 'playground:code' }]);
});

test('a trusted message after a resync-before-ready unblocks later postCode calls', () => {
	// Missed-ready race: the preview announced ready before the page listener
	// attached, so resync() sends the code before this session has seen any
	// message. The preview's reply is a plain success, not a second `ready`,
	// and that reply alone must be enough to stop postCode from dropping.
	const { posted, previewWindow, session } = createRecordingSession();

	session.resync();
	posted.length = 0;

	session.handleMessage({
		data: { type: 'playground:success' },
		origin: ORIGIN,
		source: previewWindow,
	});
	expect(posted).toEqual([]);

	session.postCode('next');
	expect(posted).toEqual([{ code: 'next', type: 'playground:code' }]);
});

const COMPILE_ERROR = 'Playground code must default-export a React component.';

const onResultCases = [
	['a success', () => ({ ok: true }) as const, { type: 'success' } as const],
	[
		'a compilation error',
		() => ({ message: COMPILE_ERROR, ok: false }) as const,
		{ message: COMPILE_ERROR, type: 'error' } as const,
	],
] as const;

for (const [name, compile, expected] of onResultCases) {
	test(`${name} reaches onResult`, () => {
		const bus = createMessageBus();
		const results: Array<PlaygroundResult> = [];
		attachFakePreview(bus, compile);
		const session = createPlaygroundPageSession({
			getCode: () => VALID_CODE,
			getPorts: () => bus.ports,
			onResult: (result) => results.push(result),
		});
		bus.listenPage((event) => session.handleMessage(event));
		session.resync();
		expect(results).toEqual([expected]);
	});
}

const ignoredMessageCases = [
	['an untrusted origin', { origin: 'https://other.test', sourceIsPreview: true }],
	[
		'a same-origin message from a source that is not the preview',
		{ origin: ORIGIN, sourceIsPreview: false },
	],
] as const;

for (const [name, { origin, sourceIsPreview }] of ignoredMessageCases) {
	test(`ignores ${name}`, () => {
		const { previewWindow, results, session } = createRecordingSession();

		session.handleMessage({
			data: { type: 'playground:success' },
			origin,
			source: sourceIsPreview ? previewWindow : { role: 'other' },
		});

		expect(results).toEqual([]);
	});
}

test('a missing preview window is a no-op for postCode and resync', () => {
	const session = createPlaygroundPageSession({
		getCode: () => VALID_CODE,
		getPorts: () => ({ origin: ORIGIN, previewWindow: null }),
		onResult: () => {},
	});

	expect(() => session.resync()).not.toThrow();
	expect(() => session.postCode(VALID_CODE)).not.toThrow();
});

test('accepts only the code message from the parent', () => {
	expect(isPlaygroundCodeMessage({ code: VALID_CODE, type: 'playground:code' })).toBe(true);
	expect(isPlaygroundCodeMessage({ type: 'playground:reset' })).toBe(false);
	expect(isPlaygroundCodeMessage({ code: 1, type: 'playground:code' })).toBe(false);
});

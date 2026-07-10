import type { ReactNode } from 'react';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vite-plus/test';
import { useSynchronizeAnimations } from './use-synchronize-animations.js';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const keyframesSheet = document.createElement('style');
keyframesSheet.textContent = `
@keyframes pulse-a { to { opacity: 0.5; } }
@keyframes pulse-b { to { opacity: 0.25; } }
`;
document.head.append(keyframesSheet);

// The hook schedules its sync in a rAF; capturing callbacks makes flush timing deterministic.
let frameCallbacks: Array<FrameRequestCallback> = [];
let roots: Array<Root> = [];
let containers: Array<HTMLElement> = [];

const requestFrame = vi.fn<(callback: FrameRequestCallback) => number>((callback) => {
	return frameCallbacks.push(callback);
});

function flushFrames() {
	while (frameCallbacks.length > 0) {
		frameCallbacks.shift()?.(0);
	}
}

function mount(node: ReactNode) {
	// Containers must be connected to the document for CSS animations to exist.
	const container = document.body.appendChild(document.createElement('div'));
	containers.push(container);
	const root = createRoot(container);
	roots.push(root);
	act(() => root.render(node));
}

/** Paused so currentTime holds still between arranging state and asserting on it. */
function AnimatedBox({ name }: { name: string }) {
	return (
		<div
			style={{
				animationDuration: '1s',
				animationIterationCount: 'infinite',
				animationName: name,
				animationPlayState: 'paused',
				animationTimingFunction: 'linear',
			}}
		/>
	);
}

function PulsingBox({ name }: { name: string | null }) {
	useSynchronizeAnimations(name);
	return name ? <AnimatedBox name={name} /> : null;
}

// Collected via Element.getAnimations so document.getAnimations call counts stay attributable to the hook.
function cssAnimationsNamed(name: string): Array<CSSAnimation> {
	return document.body
		.getAnimations({ subtree: true })
		.filter((animation): animation is CSSAnimation => {
			return animation instanceof CSSAnimation && animation.animationName === name;
		});
}

beforeEach(() => {
	frameCallbacks = [];
	roots = [];
	containers = [];
	requestFrame.mockClear();
	vi.stubGlobal('requestAnimationFrame', requestFrame);
});

afterEach(() => {
	act(() => roots.forEach((root) => root.unmount()));
	// Drain pending frames so the hook's module-level state resets between tests.
	flushFrames();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	// Remove any own-property override left by the missing-API test, restoring the prototype method.
	if (Object.hasOwn(document, 'getAnimations')) {
		// @ts-expect-error -- deleting a test-only own property
		delete document.getAnimations;
	}
	containers.forEach((container) => container.remove());
});

test('aligns every animation with the given name to the first one’s clock', () => {
	mount(
		<>
			<PulsingBox name="pulse-a" />
			<PulsingBox name="pulse-a" />
			<PulsingBox name="pulse-a" />
		</>,
	);
	const [first, second, third] = cssAnimationsNamed('pulse-a');
	first!.currentTime = 400;
	second!.currentTime = 100;
	third!.currentTime = 250;

	flushFrames();

	expect(cssAnimationsNamed('pulse-a').map((animation) => animation.currentTime)).toEqual([
		400, 400, 400,
	]);
});

test('leaves animations with other names untouched', () => {
	mount(
		<>
			<PulsingBox name="pulse-a" />
			<AnimatedBox name="pulse-b" />
			<PulsingBox name="pulse-a" />
		</>,
	);
	const [first, second] = cssAnimationsNamed('pulse-a');
	first!.currentTime = 400;
	second!.currentTime = 100;
	const [other] = cssAnimationsNamed('pulse-b');
	other!.currentTime = 999;

	flushFrames();

	expect(other?.currentTime).toBe(999);
});

test('ignores script-created animations', () => {
	mount(<PulsingBox name="pulse-a" />);
	const [container] = containers;
	if (!container) throw new Error('mount() did not register a container');
	// An element.animate() Animation is not a CSSAnimation, so the hook must never retime it.
	const scripted = container.animate([{ opacity: 1 }, { opacity: 0.5 }], {
		duration: 1000,
		iterations: Number.POSITIVE_INFINITY,
	});
	scripted.pause();
	scripted.currentTime = 50;
	const [css] = cssAnimationsNamed('pulse-a');
	if (!css) throw new Error('expected a pulse-a CSSAnimation');
	css.currentTime = 400;

	flushFrames();

	expect(scripted.currentTime).toBe(50);
	scripted.cancel();
});

test('batches same-frame mounts into a single getAnimations pass', () => {
	const getAnimations = vi.spyOn(document, 'getAnimations');

	mount(
		<>
			<PulsingBox name="pulse-a" />
			<PulsingBox name="pulse-a" />
			<PulsingBox name="pulse-a" />
		</>,
	);
	const [first, second] = cssAnimationsNamed('pulse-a');
	first!.currentTime = 400;
	second!.currentTime = 100;

	flushFrames();

	expect(getAnimations).toHaveBeenCalledTimes(1);
	expect(second?.currentTime).toBe(400);
});

test('schedules no work for a falsy animation name', () => {
	const getAnimations = vi.spyOn(document, 'getAnimations');

	mount(
		<>
			<AnimatedBox name="pulse-a" />
			<PulsingBox name={null} />
		</>,
	);
	const [animation] = cssAnimationsNamed('pulse-a');
	animation!.currentTime = 400;

	flushFrames();

	expect(requestFrame).not.toHaveBeenCalled();
	expect(getAnimations).not.toHaveBeenCalled();
	expect(animation?.currentTime).toBe(400);
});

test('mounts without throwing in browsers missing the Web Animations API', () => {
	vi.stubGlobal('CSSAnimation', undefined);
	// Simulate a browser without document.getAnimations by shadowing the prototype method.
	Object.defineProperty(document, 'getAnimations', { configurable: true, value: undefined });

	expect(() => mount(<PulsingBox name="pulse-a" />)).not.toThrow();
	expect(requestFrame).not.toHaveBeenCalled();
});

test('syncs animations mounted after an earlier sync frame has completed', () => {
	mount(<PulsingBox name="pulse-a" />);
	const [first] = cssAnimationsNamed('pulse-a');
	first!.currentTime = 400;
	flushFrames();

	mount(<PulsingBox name="pulse-a" />);
	flushFrames();

	expect(cssAnimationsNamed('pulse-a').map((animation) => animation.currentTime)).toEqual([
		400, 400,
	]);
});

import { expect, test } from 'vite-plus/test';
import { cdp } from 'vite-plus/test/context';
import { emulateColorScheme, emulateForcedColors, emulateReducedMotion } from './emulate-media.js';
import { freezeMotionForCapture, parkPointer, parkedPointerCoordinates } from './visual.js';

// Cancelling a mid-flight `text-decoration-color` transition with `transition: none` used to leave
// the underline invisible at capture time (link/kitchen-sink-tactile-light flake). Finish first.
test('freezing motion finishes an in-flight text-decoration-color transition', async () => {
	const link = document.body.appendChild(document.createElement('a'));
	link.textContent = 'Destination';
	link.href = '#';
	link.style.color = 'rgb(0, 0, 0)';
	link.style.textDecorationLine = 'underline';
	link.style.textDecorationColor = 'transparent';
	link.style.transitionProperty = 'text-decoration-color';
	link.style.transitionDuration = '10s';
	link.style.transitionTimingFunction = 'linear';
	// Force the starting style, then start a long transition toward the resting colour.
	void link.offsetHeight;
	link.style.textDecorationColor = 'rgb(0, 0, 0)';
	void link.offsetHeight;
	expect(link.getAnimations().length).toBeGreaterThan(0);

	const restore = await freezeMotionForCapture();
	try {
		const color = getComputedStyle(link).textDecorationColor;
		// Freeze pins decoration colour to currentColor (rgb from the link's color).
		expect(color).toBe('rgb(0, 0, 0)');
		expect(link.getAnimations().length).toBe(0);
	} finally {
		await restore();
		link.remove();
	}
});

test('restoring capture freeze resumes exit animations it paused', async () => {
	const overlay = document.body.appendChild(document.createElement('div'));
	overlay.setAttribute('data-exiting', '');
	const animation = overlay.animate([{ opacity: 1 }, { opacity: 0 }], {
		duration: 5000,
		fill: 'forwards',
	});
	await expect.poll(() => animation.playState).toBe('running');

	const restore = await freezeMotionForCapture();
	expect(animation.playState).toBe('paused');

	await restore();
	await expect.poll(() => animation.playState).not.toBe('paused');

	animation.cancel();
	overlay.remove();
});

test('restoring capture freeze leaves pre-paused exit animations paused', async () => {
	const overlay = document.body.appendChild(document.createElement('div'));
	overlay.setAttribute('data-exiting', '');
	const animation = overlay.animate([{ opacity: 1 }, { opacity: 0 }], {
		duration: 5000,
		fill: 'forwards',
	});
	await expect.poll(() => animation.playState).toBe('running');
	animation.pause();
	expect(animation.playState).toBe('paused');

	const restore = await freezeMotionForCapture();
	expect(animation.playState).toBe('paused');

	await restore();
	expect(animation.playState).toBe('paused');

	animation.cancel();
	overlay.remove();
});

// Luke UI overlays exit with CSS transitions. Recipes set `transition: none` under reduced motion,
// which cancels a paused CSSTransition React Aria already waited on and unmounts before capture.
test('freezing motion keeps a CSS exit transition mounted through reduced motion', async () => {
	const style = document.head.appendChild(document.createElement('style'));
	style.textContent = `
		.exit-fixture {
			opacity: 1;
			transition: opacity 5s linear;
		}
		.exit-fixture[data-exiting] {
			opacity: 0;
			transition: opacity 5s linear;
		}
		@media (prefers-reduced-motion: reduce) {
			.exit-fixture[data-exiting] {
				opacity: 1;
				transition: none;
			}
		}
	`;

	const overlay = document.body.appendChild(document.createElement('div'));
	overlay.className = 'exit-fixture';
	overlay.textContent = 'overlay';
	void overlay.offsetHeight;
	overlay.setAttribute('data-exiting', '');
	void overlay.offsetHeight;

	await expect.poll(() => overlay.getAnimations().length).toBeGreaterThan(0);
	const exitAnimation = overlay.getAnimations()[0]!;
	expect(exitAnimation.playState).toBe('running');
	expect(exitAnimation).toBeInstanceOf(CSSTransition);

	// Mirror React Aria useExitAnimation: wait on the animations present when exit starts.
	void Promise.allSettled([exitAnimation.finished]).then(() => {
		overlay.remove();
	});

	const restore = await freezeMotionForCapture();
	try {
		expect(document.body.contains(overlay)).toBe(true);
		expect(overlay.hasAttribute('data-exiting')).toBe(true);
		expect(exitAnimation.playState).toBe('paused');
		expect(overlay.getAnimations().length).toBeGreaterThan(0);
	} finally {
		await restore();
	}

	expect(document.body.contains(overlay)).toBe(true);
	await expect.poll(() => exitAnimation.playState).toBe('running');
	exitAnimation.finish();
	await expect.poll(() => document.body.contains(overlay)).toBe(false);

	style.remove();
});

test('pointer parking clears hover on an element at the viewport origin', async () => {
	const target = document.body.appendChild(document.createElement('div'));
	target.style.background = 'rgb(200, 0, 0)';
	target.style.height = '40px';
	target.style.left = '0';
	target.style.position = 'fixed';
	target.style.top = '0';
	target.style.width = '40px';

	await cdp().send('Input.dispatchMouseEvent', {
		button: 'none',
		buttons: 0,
		modifiers: 0,
		type: 'mouseMoved',
		x: 0,
		y: 0,
	});
	await expect.poll(() => target.matches(':hover')).toBe(true);

	const { x, y } = parkedPointerCoordinates();
	expect(x).toBeLessThan(0);
	expect(y).toBeLessThan(0);

	await parkPointer();
	expect(target.matches(':hover')).toBe(false);

	target.remove();
});

test('freezing motion pins text-decoration-color to currentColor', async () => {
	const link = document.body.appendChild(document.createElement('a'));
	link.textContent = 'Destination';
	link.href = '#';
	link.style.color = 'rgb(32, 64, 128)';
	link.style.textDecorationLine = 'underline';
	link.style.textDecorationColor = 'rgba(32, 64, 128, 0.2)';

	const restore = await freezeMotionForCapture();
	try {
		expect(getComputedStyle(link).textDecorationColor).toBe('rgb(32, 64, 128)');
	} finally {
		await restore();
		link.remove();
	}
});

// `Emulation.setEmulatedMedia` replaces the whole feature list, so a helper that sends one feature
// on its own drops the others. Every emulation helper shares one merged feature set to prevent it.
test('forced-colors stays active while a capture freezes reduced-motion', async () => {
	await emulateForcedColors('active');
	expect(window.matchMedia('(forced-colors: active)').matches).toBe(true);

	const restore = await freezeMotionForCapture();
	try {
		expect(window.matchMedia('(forced-colors: active)').matches).toBe(true);
		expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
	} finally {
		await restore();
	}

	expect(window.matchMedia('(forced-colors: active)').matches).toBe(true);
	expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(false);

	await emulateForcedColors('none');
});

test('the colour-scheme and reduced-motion helpers each keep forced-colors', async () => {
	await emulateForcedColors('active');

	await emulateColorScheme('dark');
	expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(true);
	expect(window.matchMedia('(forced-colors: active)').matches).toBe(true);

	await emulateReducedMotion(true);
	expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
	expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(true);
	expect(window.matchMedia('(forced-colors: active)').matches).toBe(true);

	await emulateReducedMotion(false);
	await emulateColorScheme('light');
	await emulateForcedColors('none');
});

// A capture restores whatever reduced-motion value was in force before it, not a hardcoded default.
test('a capture restores an explicitly set reduced-motion preference', async () => {
	await emulateReducedMotion(true);

	const restore = await freezeMotionForCapture();
	await restore();

	expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);

	await emulateReducedMotion(false);
});

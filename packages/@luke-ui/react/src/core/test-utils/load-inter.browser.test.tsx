import { Code } from '@luke-ui/react/code';
import { expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { codeFontFamilyStack } from '../../theme/foundation.js';
import { peekEmulatedMediaFeatures } from './emulated-media.js';
import { loadVisualFonts, PINNED_MONO_FAMILY } from './load-inter.js';
import { render } from './render.js';
import { captureVisual } from './visual.js';

test('Code mounts with the pinned mono face from browser setup', async () => {
	await loadVisualFonts();
	const { container } = render(<Code>--luke-color-text-primary</Code>);
	const probe = container.querySelector('code');
	expect(probe).toBeInstanceOf(HTMLElement);
	// Setup pins rendering before mount; `--luke-font-family-code` stays the theme stack.
	expect(getComputedStyle(probe as HTMLElement).fontFamily).toContain(PINNED_MONO_FAMILY);
	expect(
		getComputedStyle(document.documentElement).getPropertyValue('--luke-font-family-code').trim(),
	).toBe(codeFontFamilyStack);
});

test('captureVisual releases motion freeze when getAnimations throws', async () => {
	const { locator } = render(<Code>capture freeze failure</Code>);
	await expect.element(locator).toBeVisible();
	const probe = locator.element().querySelector('code') ?? locator.element();

	const originalGetAnimations = document.getAnimations.bind(document);
	Object.defineProperty(document, 'getAnimations', {
		configurable: true,
		value: () => {
			throw new Error('injected getAnimations failure');
		},
	});

	try {
		await expect(
			captureVisual(page.elementLocator(locator.element()), 'code/freeze-fail'),
		).rejects.toThrow('injected getAnimations failure');
		expect(document.getElementById('luke-ui-capture-freeze-motion')).toBeNull();
		expect(peekEmulatedMediaFeatures()['prefers-reduced-motion']).not.toBe('reduce');
		// Setup still owns code rendering for the rest of the test.
		expect(getComputedStyle(probe).fontFamily).toContain(PINNED_MONO_FAMILY);
		expect(
			getComputedStyle(document.documentElement).getPropertyValue('--luke-font-family-code').trim(),
		).toBe(codeFontFamilyStack);
	} finally {
		Object.defineProperty(document, 'getAnimations', {
			configurable: true,
			value: originalGetAnimations,
		});
	}
});

test('captureVisual restores motion when scrollHeight throws after freeze', async () => {
	const { locator } = render(<Code>capture scrollHeight failure</Code>);
	await expect.element(locator).toBeVisible();
	const element = locator.element();
	const probe = element.querySelector('code') ?? element;

	const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollHeight');
	if (descriptor === undefined || typeof descriptor.get !== 'function') {
		throw new Error('Expected Element.prototype.scrollHeight getter');
	}
	// Stash the prototype getter so the override can delegate for other elements.
	// eslint-disable-next-line typescript/unbound-method -- intentional stash of the prototype getter
	const originalScrollHeightGet = descriptor.get;

	Object.defineProperty(Element.prototype, 'scrollHeight', {
		configurable: true,
		enumerable: descriptor.enumerable ?? false,
		get() {
			if (this === element) {
				throw new Error('injected scrollHeight failure');
			}
			return originalScrollHeightGet.call(this);
		},
	});

	try {
		await expect(
			captureVisual(page.elementLocator(element), 'code/scrollheight-fail'),
		).rejects.toThrow('injected scrollHeight failure');
		expect(document.getElementById('luke-ui-capture-freeze-motion')).toBeNull();
		expect(peekEmulatedMediaFeatures()['prefers-reduced-motion']).not.toBe('reduce');
		expect(getComputedStyle(probe).fontFamily).toContain(PINNED_MONO_FAMILY);
		expect(
			getComputedStyle(document.documentElement).getPropertyValue('--luke-font-family-code').trim(),
		).toBe(codeFontFamilyStack);
	} finally {
		Object.defineProperty(Element.prototype, 'scrollHeight', descriptor);
	}
});

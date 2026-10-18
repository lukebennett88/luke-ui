import { Code } from '@luke-ui/react/code';
import { expect, test } from 'vite-plus/test';
import { loadVisualFonts, PINNED_MONO_FAMILY, pinCodeFamilyForCapture } from './load-inter.js';
import { render } from './render.js';

test('pinned visual fonts are ready before render so mounts do not use fallback metrics', async () => {
	await loadVisualFonts();

	expect(document.fonts.check('16px Inter')).toBe(true);
	expect(document.fonts.check(`16px "${PINNED_MONO_FAMILY}"`)).toBe(true);
});

test('pinning the code family for capture remaps Code to the pinned mono face and restores after', async () => {
	await loadVisualFonts();
	const { container } = render(<Code>--luke-color-text-primary</Code>);
	const probe = container.querySelector('code');
	expect(probe).toBeInstanceOf(HTMLElement);

	const restore = pinCodeFamilyForCapture();
	try {
		expect(getComputedStyle(probe as HTMLElement).fontFamily).toContain(PINNED_MONO_FAMILY);
		expect(
			getComputedStyle(document.documentElement).getPropertyValue('--luke-font-family-code'),
		).toContain(PINNED_MONO_FAMILY);
	} finally {
		restore();
	}

	expect(
		getComputedStyle(document.documentElement).getPropertyValue('--luke-font-family-code'),
	).not.toContain(PINNED_MONO_FAMILY);
});

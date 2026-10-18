import { Code } from '@luke-ui/react/code';
import { expect, test } from 'vite-plus/test';
import { loadVisualFonts, PINNED_MONO_FAMILY, pinCodeFamily } from './load-inter.js';
import { render } from './render.js';

const PINNED_CODE_FAMILY_STYLE_ID = 'luke-ui-pinned-code-family';

test('Code mounts with the pinned mono face from browser setup', async () => {
	await loadVisualFonts();
	const { container } = render(<Code>--luke-color-text-primary</Code>);
	const probe = container.querySelector('code');
	expect(probe).toBeInstanceOf(HTMLElement);
	// Setup pins before mount; do not call pinCodeFamily here.
	expect(getComputedStyle(probe as HTMLElement).fontFamily).toContain(PINNED_MONO_FAMILY);
	expect(document.getElementById(PINNED_CODE_FAMILY_STYLE_ID)).not.toBeNull();
});

test('code-family pin acquired during capture setup is released when freeze throws', async () => {
	await loadVisualFonts();
	const pinCountBefore = document.querySelectorAll(`#${PINNED_CODE_FAMILY_STYLE_ID}`).length;

	async function captureSetupThatFreezes(freeze: () => Promise<void>) {
		let restoreCodeFamily: (() => void) | undefined;
		let restoreMotion: (() => Promise<void>) | undefined;
		try {
			restoreCodeFamily = pinCodeFamily();
			restoreMotion = async () => undefined;
			await freeze();
		} finally {
			try {
				if (restoreMotion !== undefined) await restoreMotion();
			} finally {
				restoreCodeFamily?.();
			}
		}
	}

	await expect(
		captureSetupThatFreezes(async () => {
			throw new Error('freeze failed');
		}),
	).rejects.toThrow('freeze failed');

	// Nested capture pin released; setup pin remains (one stylesheet) so fixtures stay deterministic.
	expect(document.querySelectorAll(`#${PINNED_CODE_FAMILY_STYLE_ID}`)).toHaveLength(pinCountBefore);
	expect(
		getComputedStyle(document.documentElement).getPropertyValue('--luke-font-family-code'),
	).toContain(PINNED_MONO_FAMILY);
});

test('motion restore throw still releases the capture code-family pin', async () => {
	await loadVisualFonts();
	const pinCountBefore = document.querySelectorAll(`#${PINNED_CODE_FAMILY_STYLE_ID}`).length;

	async function captureSetupWithFailingMotionRestore() {
		let restoreCodeFamily: (() => void) | undefined;
		try {
			restoreCodeFamily = pinCodeFamily();
		} finally {
			try {
				await Promise.reject(new Error('motion restore failed'));
			} finally {
				restoreCodeFamily?.();
			}
		}
	}

	await expect(captureSetupWithFailingMotionRestore()).rejects.toThrow('motion restore failed');
	expect(document.querySelectorAll(`#${PINNED_CODE_FAMILY_STYLE_ID}`)).toHaveLength(pinCountBefore);
});

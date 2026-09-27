import { expect, test } from 'vite-plus/test';
import {
	isPlaygroundAppearanceMessage,
	postPlaygroundAppearance,
} from './playground-appearance-message.js';

test('accepts a complete playground appearance update', () => {
	expect(
		isPlaygroundAppearanceMessage({
			colorMode: 'system',
			themeIdentity: 'paper',
			type: 'luke-ui-docs:appearance',
		}),
	).toBe(true);
});

test('rejects an unknown playground appearance', () => {
	expect(
		isPlaygroundAppearanceMessage({
			colorMode: 'sepia',
			themeIdentity: 'custom',
			type: 'luke-ui-docs:appearance',
		}),
	).toBe(false);
});

test('posts the appearance to the preview origin only when the preview exists', () => {
	const posted: Array<[unknown, string]> = [];
	const previewWindow = {
		postMessage(message: unknown, targetOrigin: string) {
			posted.push([message, targetOrigin]);
		},
	};
	const appearance = { colorMode: 'dark', themeIdentity: 'tactile' } as const;

	postPlaygroundAppearance(appearance, { origin: 'https://docs.test', previewWindow: null });
	postPlaygroundAppearance(appearance, { origin: 'https://docs.test', previewWindow });

	expect(posted).toEqual([
		[
			{ colorMode: 'dark', themeIdentity: 'tactile', type: 'luke-ui-docs:appearance' },
			'https://docs.test',
		],
	]);
});

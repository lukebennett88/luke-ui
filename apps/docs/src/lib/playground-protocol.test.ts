import { expect, test } from 'vite-plus/test';
import { isPlaygroundParentMessage } from './playground-protocol.js';

test('accepts a complete playground appearance update', () => {
	expect(
		isPlaygroundParentMessage({
			colorMode: 'system',
			themeIdentity: 'paper',
			type: 'playground:appearance',
		}),
	).toBe(true);
});

test('rejects an unknown playground appearance', () => {
	expect(
		isPlaygroundParentMessage({
			colorMode: 'sepia',
			themeIdentity: 'custom',
			type: 'playground:appearance',
		}),
	).toBe(false);
});

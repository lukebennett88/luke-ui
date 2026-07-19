import { expect, test } from 'vite-plus/test';
import packageJson from '../../package.json' with { type: 'json' };

test('publishes only the final styling entrypoints', () => {
	expect(packageJson.exports['./box']).toBe('./dist/box/index.js');
	expect(packageJson.exports['./theme']).toBe('./dist/theme/index.js');
	expect(packageJson.exports['./themes']).toBe('./dist/themes/index.js');
	expect(packageJson.exports['./recipes']).toBe('./dist/recipes/index.js');
	expect(packageJson.exports['./preset']).toBe('./dist/preset/index.js');
	expect(packageJson.exports['./styles']).toBe('./dist/styles/index.js');
	expect(packageJson.exports['./stylesheet.css']).toBe('./dist/stylesheet.css');
	expect('./tokens' in packageJson.exports).toBe(false);
	expect('./css' in packageJson.exports).toBe(false);
});

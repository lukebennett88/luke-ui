import { expect, test } from 'vite-plus/test';
import packageJson from '../../package.json' with { type: 'json' };

test('publishes only the final styling entrypoints', () => {
	expect(packageJson.exports['./box']).toBe('./dist/box/index.js');
	expect(packageJson.exports['./theme']).toBe('./dist/theme/index.js');
	expect(packageJson.exports['./themes/tactile']).toBe('./dist/themes/tactile/index.js');
	expect(packageJson.exports['./themes/paper']).toBe('./dist/themes/paper/index.js');
	expect(packageJson.exports['./styles']).toBe('./dist/styles/index.js');
	expect(packageJson.exports['./stylesheet.css']).toBe('./dist/stylesheet.css');
	expect('./recipes' in packageJson.exports).toBe(false);
	expect('./heading-context' in packageJson.exports).toBe(false);
	expect('./icon-size-context' in packageJson.exports).toBe(false);
	expect('./button/primitive' in packageJson.exports).toBe(false);
	expect(packageJson.exports['./primitives/button']).toBe('./dist/primitives/button/index.js');
	expect(packageJson.exports['./primitives/checkbox']).toBe('./dist/primitives/checkbox/index.js');
	expect(packageJson.exports['./primitives/combobox']).toBe('./dist/primitives/combobox/index.js');
	expect(packageJson.exports['./primitives/field']).toBe('./dist/primitives/field/index.js');
	expect(packageJson.exports['./primitives/input-group']).toBe(
		'./dist/primitives/input-group/index.js',
	);
	expect('./primitives' in packageJson.exports).toBe(false);
	expect('./tokens' in packageJson.exports).toBe(false);
});

test('requires react-aria-components as a peer dependency', () => {
	expect(packageJson.peerDependencies['react-aria-components']).toBe('catalog:');
	expect('react-aria-components' in (packageJson.dependencies as Record<string, string>)).toBe(
		false,
	);
	expect(packageJson.devDependencies['react-aria-components']).toBe('catalog:');
});

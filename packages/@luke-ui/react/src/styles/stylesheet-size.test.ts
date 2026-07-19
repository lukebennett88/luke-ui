import { expect, test } from 'vite-plus/test';
import packageJson from '../../package.json' with { type: 'json' };

test('build assembles the public stylesheet after Vanilla Extract emits its CSS', () => {
	expect(packageJson.scripts.build).toBe('pnpm run build:tsdown && pnpm run build:stylesheet');
	expect(packageJson.scripts['build:stylesheet']).toBe(
		'tsx scripts/assemble-stylesheet.ts --output=dist/stylesheet.css',
	);
});

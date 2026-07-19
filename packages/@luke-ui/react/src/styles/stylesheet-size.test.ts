import { expect, test } from 'vite-plus/test';
import packageJson from '../../package.json' with { type: 'json' };

test('build assembles the public Panda stylesheet before packaging it', () => {
	expect(packageJson.scripts.build).toBe('pnpm run build:stylesheet && pnpm run build:tsdown');
	expect(packageJson.scripts['build:stylesheet']).toBe(
		'tsx scripts/assemble-stylesheet.ts --output=dist/stylesheet.css',
	);
});

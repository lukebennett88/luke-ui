import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vite-plus/test';

const generatedTypesPath = resolve(
	import.meta.dirname,
	'../generated/playground-types.generated.json',
);

test('generated Monaco playground types omit styling-engine packages', () => {
	const files = JSON.parse(readFileSync(generatedTypesPath, 'utf8')) as Record<string, string>;
	const paths = Object.keys(files);

	expect(paths.some((path) => path.includes('@luke-ui/react/'))).toBe(true);
	expect(paths.some((path) => path.includes('vanilla-extract'))).toBe(false);
	expect(paths.some((path) => path.includes('rainbow-sprinkles'))).toBe(false);

	const stylesDeclaration = files['file:///node_modules/@luke-ui/react/dist/styles.d.ts'];
	expect(stylesDeclaration).toBeTypeOf('string');
	expect(stylesDeclaration).not.toMatch(/from ["']@vanilla-extract\//);
	expect(stylesDeclaration).not.toMatch(/from ["']@luke-ui\/rainbow-sprinkles["']/);

	const utilitiesDeclaration = Object.entries(files).find(([path]) => {
		return /\/@luke-ui\/react\/dist\/utilities\.css[^/]*\.d\.ts$/.test(path);
	})?.[1];
	expect(utilitiesDeclaration).toBeTypeOf('string');
	expect(utilitiesDeclaration).toMatch(/from ["']csstype["']/);
	expect(utilitiesDeclaration).not.toMatch(/from ["']@vanilla-extract\//);
	expect(utilitiesDeclaration).not.toMatch(/from ["']@luke-ui\/rainbow-sprinkles["']/);
});

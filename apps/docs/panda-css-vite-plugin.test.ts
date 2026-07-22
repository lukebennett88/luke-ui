import { expect, test } from 'vite-plus/test';
import { removePandaDesignSystemCss } from './panda-css-vite-plugin.js';

test('keeps authored layers and Panda utilities while removing Panda DS layers', () => {
	const sourceCss = `@layer reset, base, tokens, recipes, box, utilities;
@layer base { .app-base { color: green; } }`;
	const transformedCss = `${sourceCss}
@layer base { .panda-base { color: red; } }
@layer tokens { :root { --colors-text-primary: red; } }
@layer recipes { .recipe { color: red; } }
@layer utilities { .utility { color: blue; } }`;

	const result = removePandaDesignSystemCss(sourceCss, transformedCss);

	expect(result).toContain('@layer base { .app-base { color: green; } }');
	expect(result).not.toContain('.panda-base');
	expect(result).not.toContain('--colors-text-primary');
	expect(result).not.toContain('.recipe');
	expect(result).toContain('@layer utilities { .utility { color: blue; } }');
});

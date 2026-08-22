import { setAdapter } from '@vanilla-extract/css/adapter';
import { endFileScope, setFileScope } from '@vanilla-extract/css/fileScope';
import { transformCss } from '@vanilla-extract/css/transformCss';
import { describe, expect, it } from 'vite-plus/test';
import { defineProperties } from './define-properties.js';

type Adapter = Parameters<typeof setAdapter>[0];
type CapturedCss = Parameters<Adapter['appendCss']>[0];

/**
 * Compiles a `defineProperties` config to real CSS text by installing a capturing adapter around
 * it. `style()` reports each rule to the active adapter instead of a bundler's `.css.ts` pipeline,
 * so `transformCss` renders the same text a consumer's build would emit, without one.
 */
function compileToCss(build: () => void): string {
	const cssObjs: Array<CapturedCss> = [];
	const localClassNames: Array<string> = [];
	setAdapter({
		appendCss: (css) => cssObjs.push(css),
		getIdentOption: () => 'debug',
		markCompositionUsed: () => {},
		onEndFileScope: () => {},
		registerClassName: (className) => localClassNames.push(className),
		registerComposition: () => {},
	});

	setFileScope('define-properties.test.ts');
	build();
	endFileScope();

	return transformCss({ composedClassLists: [], cssObjs, localClassNames }).join('\n');
}

describe('defineProperties @container support', () => {
	it('wraps a `@container` condition in a `@container (...)` at-rule around the declaration', () => {
		const css = compileToCss(() => {
			defineProperties({
				conditions: {
					initial: {},
					wide: { '@container': '(width >= 400px)' },
				},
				defaultCondition: 'initial',
				dynamicProperties: { padding: true },
			});
		});

		expect(css).toContain('@container (width >= 400px) {');
		const containerRule =
			/@container \(width >= 400px\) \{\s*\.[\w-]+ \{\s*padding: var\(--[\w-]+\);\s*\}\s*\}/;
		expect(css).toMatch(containerRule);
	});
});

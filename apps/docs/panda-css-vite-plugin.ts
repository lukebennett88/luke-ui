import pandacss from '@pandacss/dev/postcss';
import postcss from 'postcss';
import type { AcceptedPlugin } from 'postcss';
import type { Plugin } from 'vite-plus';

// Panda runs as a PostCSS pass wrapped in a Vite plugin (the #132 "Panda as a
// PostCSS plugin alongside @tailwindcss/vite" decision).
//
// It CANNOT go through a plain postcss.config because `@tailwindcss/vite`
// registers `enforce: 'pre'` transforms that expand `@import 'tailwindcss'` and
// rewrite the `@layer …;` declaration in app.css — the exact anchor Panda's
// PostCSS plugin injects its generated atomics at. A plain postcss.config runs
// in Vite's core CSS transform (after those `pre` transforms), so Panda would
// only ever see already-expanded CSS with no anchor and emit nothing.
//
// So Panda is itself an `enforce: 'pre'` Vite plugin that MUST be ordered before
// `tailwindcss()` in the plugins array: it injects the docs' generated atomics
// into `@layer utilities` on the raw app.css, then Tailwind expands its own
// layers around them. Both outputs end up in the bundle.
export function pandaCss(): Plugin {
	// `@pandacss/dev/postcss` bundles its own postcss types, which tsc treats as a
	// distinct identity from the app's postcss (both resolve to the same version at
	// runtime); the cast bridges that dual-package type skew.
	const processor = postcss([pandacss() as AcceptedPlugin]);
	return {
		name: 'luke-docs-panda-css',
		enforce: 'pre',
		async transform(code, id) {
			const [path = ''] = id.split('?');
			if (!path.endsWith('/src/styles/app.css')) return null;
			// Skip non-CSS variants of the same id (e.g. `?url` emits a JS module).
			// The real CSS always opens with the `@layer …;` declaration.
			if (!/^\s*@layer\b/.test(code)) return null;
			const result = await processor.process(code, { from: path });
			return { code: result.css };
		},
	};
}

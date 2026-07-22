import { readdirSync, utimesSync } from 'node:fs';
import { extname, join } from 'node:path';
import pandacss from '@pandacss/dev/postcss';
import postcss from 'postcss';
import type { AcceptedPlugin } from 'postcss';
import type { Plugin } from 'vite-plus';

// Panda records the source files/globs it extracted from on the PostCSS
// `result.messages` array: `{ type: 'dependency', file }` for individual files
// (its config + presets) and `{ type: 'dir-dependency', dir, glob }` for watched
// directory globs (its `include`, e.g. `./src/**/*.{ts,tsx}`).
type PandaDependencyMessage =
	| { type: 'dependency'; file: string }
	| { type: 'dir-dependency'; dir: string; glob?: string };

const pandaDesignSystemLayers = new Set(['base', 'recipes', 'reset', 'tokens']);

function isDependencyMessage(
	message: postcss.Message,
): message is postcss.Message & PandaDependencyMessage {
	return message.type === 'dependency' || message.type === 'dir-dependency';
}

// A `dir-dependency` only names the directory, and a bare directory watch won't
// fire when an *existing* file inside it is edited (editing content doesn't
// change the directory's mtime). So resolve the directory to the extractable
// source files and track each one individually. Panda's include glob is
// recursive (`**/*.{ts,tsx}`), so a recursive read matches it.
function collectSourceFiles(dir: string): Array<string> {
	try {
		return readdirSync(dir, { recursive: true, withFileTypes: true })
			.filter(
				(entry) =>
					entry.isFile() && (extname(entry.name) === '.ts' || extname(entry.name) === '.tsx'),
			)
			.map((entry) => join(entry.parentPath, entry.name));
	} catch {
		return [];
	}
}

/** Removes only Panda-appended design-system layers, keeping authored CSS and generated utilities. */
export function removePandaDesignSystemCss(sourceCss: string, transformedCss: string): string {
	const sourceRoot = postcss.parse(sourceCss);
	const transformedRoot = postcss.parse(transformedCss);
	const sourceNodeCount = sourceRoot.nodes?.length ?? 0;

	for (const node of transformedRoot.nodes?.slice(sourceNodeCount) ?? []) {
		if (
			node.type === 'atrule' &&
			node.name === 'layer' &&
			node.nodes &&
			pandaDesignSystemLayers.has(node.params)
		) {
			node.remove();
		}
	}

	return transformedRoot.toString();
}

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
	// The files Panda extracted atomics from on the last pass, and the app.css
	// file we injected them into. `hotUpdate` uses these to re-run the pass when a
	// source file changes — see the transform/hotUpdate hooks below.
	const pandaSources = new Set<string>();
	let appCssFile: string | undefined;
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
			appCssFile = path;
			// Panda reports every file/glob it extracted atomics from. Record them and
			// register each as a Vite watch dependency of app.css so the files Panda
			// reads — its config, presets, and any source files that aren't otherwise
			// in Vite's import graph — are watched, which is what makes `hotUpdate`
			// fire for them. (`hotUpdate` does the actual re-run; see below.)
			pandaSources.clear();
			for (const message of result.messages) {
				if (!isDependencyMessage(message)) continue;
				const files =
					message.type === 'dependency' ? [message.file] : collectSourceFiles(message.dir);
				for (const file of files) {
					pandaSources.add(file);
					this.addWatchFile(file);
				}
			}
			return { code: removePandaDesignSystemCss(code, result.css) };
		},
		// Editing a `css({…})` value in a component hot-updates that module (React
		// refresh) but leaves app.css untouched, so this plugin's pass never re-runs
		// and the new atomic's rule is never injected. Invalidating app.css's module
		// isn't enough: the atomics live behind `@tailwindcss/vite` and Vite's core
		// CSS transform, whose caches key on app.css's own (unchanged) source and so
		// keep serving the stale stylesheet. Bumping app.css's mtime drives it back
		// through Vite's normal file-change path — re-running Panda and busting the
		// downstream CSS caches — so the freshly extracted atomic reaches the browser
		// without app.css's contents having to change.
		hotUpdate(options) {
			// Touch once (not per environment), and never for app.css itself so the
			// mtime bump can't recurse.
			if (this.environment.name !== 'client') return;
			if (!appCssFile || !pandaSources.has(options.file)) return;
			const now = new Date();
			utimesSync(appCssFile, now, now);
		},
	};
}

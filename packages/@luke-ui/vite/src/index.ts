import { join } from 'node:path';
import { transformAsync } from '@babel/core';
import stylexBabelPlugin from '@stylexjs/babel-plugin';
import type { Rule } from '@stylexjs/babel-plugin';
import { readdir, readFile } from 'node:fs/promises';
import type { Plugin } from 'vite';

/** Public stylesheet subpath consumers import for the `xstyle` layer order and extracted CSS. */
export const STYLESHEET_IMPORT = '@luke-ui/vite/stylesheet.css';

const RESOLVED_STYLESHEET_ID = '\0luke-ui-vite:stylesheet.css';
const LAYER_ORDER = '@layer reset, theme, base, recipes, xstyle, components, utilities;';
const LAYER_CONFIG = {
	before: ['reset', 'theme', 'base', 'recipes'],
	after: ['components', 'utilities'],
	prefix: 'xstyle',
} as const;
/** Replaced in `generateBundle`. The declaration keeps Vite's CSS minifier from dropping it. */
const PLACEHOLDER = '.stylex-placeholder{--stylex-placeholder:0}';
const PLACEHOLDER_PATTERN = /\.stylex-placeholder\s*\{[^}]*\}/;
/** A `.ts`/`.tsx`/`.js`/`.jsx` module, excluding declaration files. */
const STYLEX_ELIGIBLE_MODULE_PATTERN = /(?<!\.d)\.[cm]?[jt]sx?$/;
const SKIP_DIRECTORY_NAMES = new Set(['dist', '.git', 'node_modules']);
const PACKAGE_STYLESHEET_PATH_PATTERN =
	/[/\\]@luke-ui[/\\]vite[/\\](?:(?:dist|src)[/\\])?stylesheet\.css$/;

/**
 * Vite plugin for applications that author Luke UI `xstyle` values.
 *
 * Add `lukeUi()` to the Vite config and import `@luke-ui/vite/stylesheet.css` before the Luke UI
 * stylesheet. No options are required for the normal case.
 */
export function lukeUi(): Plugin {
	const rulesByFile = new Map<string, Array<Rule>>();
	let isDevServer = false;
	let rootDir = '';
	let sourceRules: Promise<Array<Rule>> | undefined;

	function collectedCss(rules: ReadonlyArray<Rule>): string {
		const stylexCss = stylexBabelPlugin.processStylexRules([...rules], {
			useLayers: LAYER_CONFIG,
		});
		return `${LAYER_ORDER}\n${stylexCss}`;
	}

	async function transformStylex(code: string, filename: string) {
		if (!STYLEX_ELIGIBLE_MODULE_PATTERN.test(filename)) return null;
		if (filename.includes('/node_modules/') || filename.includes('\\node_modules\\')) return null;
		if (!code.includes('@stylexjs/stylex')) return null;
		const result = await transformAsync(code, {
			babelrc: false,
			configFile: false,
			filename,
			parserOpts: { plugins: ['typescript', 'jsx'] },
			plugins: [
				stylexBabelPlugin.withOptions({
					dev: false,
					unstable_moduleResolution: { type: 'commonJS', rootDir },
				}),
			],
		});
		if (result?.code == null) return null;
		const rules = (result.metadata as { stylex?: Array<Rule> } | undefined)?.stylex;
		return { code: result.code, rules };
	}

	async function collectSourceRules(): Promise<Array<Rule>> {
		const filenames = await findSourceModules(rootDir);
		const perFileRules = await Promise.all(
			filenames.map(async (filename) => {
				const code = await readFile(filename, 'utf8');
				const result = await transformStylex(code, filename);
				return result?.rules ?? [];
			}),
		);
		return perFileRules.flat();
	}

	return {
		name: 'luke-ui',
		enforce: 'pre',
		configResolved(config) {
			rootDir = config.root;
			isDevServer = config.command === 'serve';
		},
		resolveId(id) {
			if (isStylesheetImport(id)) return RESOLVED_STYLESHEET_ID;
		},
		async load(id) {
			if (id !== RESOLVED_STYLESHEET_ID) return;
			// A build has not traversed the module graph yet, so not all rules are
			// collected. Emit a placeholder and replace it in `generateBundle`.
			if (!isDevServer) return `${LAYER_ORDER}\n${PLACEHOLDER}`;
			// Dev does not wait for `transform` either. Scan the application source
			// so the first stylesheet already contains every StyleX rule.
			sourceRules ??= collectSourceRules();
			return collectedCss(await sourceRules);
		},
		async transform(code, id) {
			const filename = id.split('?')[0] ?? id;
			const result = await transformStylex(code, filename);
			if (result === null) return;
			if (result.rules?.length) rulesByFile.set(id, result.rules);
			else rulesByFile.delete(id);
			return { code: result.code };
		},
		hotUpdate({ file, modules }) {
			if (!STYLEX_ELIGIBLE_MODULE_PATTERN.test(file)) return;
			sourceRules = undefined;
			const stylesheetModule = this.environment.moduleGraph.getModuleById(RESOLVED_STYLESHEET_ID);
			if (stylesheetModule === undefined) return;
			// Nothing that changed imports the stylesheet module, so Vite never collects
			// it into `modules` on its own.
			return [...modules, stylesheetModule];
		},
		generateBundle(_options, bundle) {
			const css = collectedCss([...rulesByFile.values()].flat());
			for (const asset of Object.values(bundle)) {
				if (asset.type !== 'asset' || typeof asset.source !== 'string') continue;
				if (!PLACEHOLDER_PATTERN.test(asset.source)) continue;
				asset.source = asset.source.replace(PLACEHOLDER_PATTERN, css.slice(LAYER_ORDER.length + 1));
			}
		},
	};
}

function isStylesheetImport(id: string): boolean {
	if (id === STYLESHEET_IMPORT) return true;
	if (PACKAGE_STYLESHEET_PATH_PATTERN.test(id)) return true;
	return false;
}

async function findSourceModules(directory: string): Promise<Array<string>> {
	const entries = await readdir(directory, { withFileTypes: true });
	const filenames = await Promise.all(
		entries.map(async (entry) => {
			const filename = join(directory, entry.name);
			if (entry.isDirectory()) {
				if (SKIP_DIRECTORY_NAMES.has(entry.name)) return [];
				return findSourceModules(filename);
			}
			if (!STYLEX_ELIGIBLE_MODULE_PATTERN.test(filename)) return [];
			return [filename];
		}),
	);
	return filenames.flat();
}

import { join } from 'node:path';
import { transformAsync } from '@babel/core';
import stylexBabelPlugin from '@stylexjs/babel-plugin';
import type { Rule } from '@stylexjs/babel-plugin';
import { readdir, readFile } from 'node:fs/promises';
import type { Plugin } from 'vite';

const VIRTUAL_ID = 'virtual:stylex.css';
const RESOLVED_ID = '\0virtual:stylex.css';
const LAYER_CONFIG = {
	before: ['reset', 'theme', 'base', 'recipes'],
	after: ['components', 'utilities'],
	prefix: 'xstyle',
} as const;
// The plugin replaces this in `generateBundle`. The declaration prevents Vite's CSS
// minifier from removing it first.
const PLACEHOLDER = '.stylex-placeholder{--stylex-placeholder:0}';
const PLACEHOLDER_PATTERN = /\.stylex-placeholder\s*\{[^}]*\}/;
/** A `.ts`/`.tsx`/`.js`/`.jsx` module, excluding declaration files. */
const STYLEX_ELIGIBLE_MODULE_PATTERN = /(?<!\.d)\.[cm]?[jt]sx?$/;
const SKIP_DIRECTORY_NAMES = new Set(['dist', '.git', 'node_modules']);

export function stylex({ rootDir }: { rootDir: string }): Plugin {
	const rulesByFile = new Map<string, Array<Rule>>();
	let isDevServer = false;
	let sourceRules: Promise<Array<Rule>> | undefined;

	function collectedCss(rules: ReadonlyArray<Rule>): string {
		return stylexBabelPlugin.processStylexRules([...rules], {
			useLayers: LAYER_CONFIG,
		});
	}

	async function transformStylex(code: string, filename: string) {
		if (!STYLEX_ELIGIBLE_MODULE_PATTERN.test(filename)) return null;
		if (filename.includes('/node_modules/')) return null;
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
		name: 'stylex',
		configResolved(config) {
			isDevServer = config.command === 'serve';
		},
		resolveId(id) {
			if (id === VIRTUAL_ID) return RESOLVED_ID;
		},
		async load(id) {
			if (id !== RESOLVED_ID) return;
			// A build has not traversed the module graph yet, so not all rules are
			// collected. Emit a placeholder and replace it in `generateBundle`.
			if (!isDevServer) return PLACEHOLDER;
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
			const virtualModule = this.environment.moduleGraph.getModuleById(RESOLVED_ID);
			if (virtualModule === undefined) return;
			// Nothing that changed imports the virtual module, so Vite never collects
			// it into `modules` on its own.
			return [...modules, virtualModule];
		},
		generateBundle(_options, bundle) {
			const css = collectedCss([...rulesByFile.values()].flat());
			for (const asset of Object.values(bundle)) {
				if (asset.type !== 'asset' || typeof asset.source !== 'string') continue;
				if (!PLACEHOLDER_PATTERN.test(asset.source)) continue;
				asset.source = asset.source.replace(PLACEHOLDER_PATTERN, css);
			}
		},
	};
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

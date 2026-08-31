import { transformAsync } from '@babel/core';
import stylexBabelPlugin from '@stylexjs/babel-plugin';
import type { Rule } from '@stylexjs/babel-plugin';
import type { Plugin } from 'vite-plus';

export function stylexPlugin(rootDir: string): Plugin {
	let stylexRules = new Map<string, Array<Rule>>();

	return {
		name: 'stylex',
		buildStart() {
			stylexRules = new Map();
		},
		shouldTransformCachedModule({ id, meta }) {
			// A watch rebuild skips `transform` for unchanged modules, so their rules have to be
			// read back off the cached metadata or they vanish from the stylesheet.
			const { stylex } = meta as { stylex?: Array<Rule> };
			if (stylex !== undefined) stylexRules.set(id, stylex);
			return false;
		},
		async transform(code, id) {
			// Cheap gate: parsing every module through Babel to find the few that use StyleX
			// would roughly double build time.
			if (id.endsWith('.d.ts') || !code.includes('@stylexjs/stylex')) return null;

			const filename = id.split('?')[0] ?? id;

			const result = await transformAsync(code, {
				babelrc: false,
				configFile: false,
				filename,
				parserOpts: {
					plugins:
						filename.endsWith('.tsx') || filename.endsWith('.jsx')
							? ['typescript', 'jsx']
							: ['typescript'],
				},
				plugins: [
					stylexBabelPlugin.withOptions({
						dev: false,
						unstable_moduleResolution: { type: 'commonJS', rootDir },
					}),
				],
				sourceMaps: true,
			});

			if (result?.code == null) {
				throw new Error(
					`StyleX could not compile ${filename}. Every \`stylex\` declaration must be statically extractable.`,
				);
			}

			const meta = result.metadata as { stylex?: Array<Rule> };

			// Drop the entry when a module stops producing rules, so a watch rebuild replaces its
			// contribution instead of leaving the previous rules stranded in the map.
			if (meta.stylex === undefined) stylexRules.delete(id);
			else stylexRules.set(id, meta.stylex);

			return { code: result.code, map: result.map, meta };
		},
		generateBundle(_options, bundle) {
			const rules = [...stylexRules.values()].flat();
			if (rules.length === 0) return;

			const stylesheet = bundle['stylesheet.css'];
			if (stylesheet?.type !== 'asset') {
				throw new Error('Expected a `stylesheet.css` asset to append StyleX rules to.');
			}

			const stylexCss = stylexBabelPlugin.processStylexRules(rules, {
				// Unlayered until StyleX joins the cascade-layer contract.
				useLayers: false,
			});

			stylesheet.source = `${stylesheet.source.toString()}\n/* stylex */\n${stylexCss}`;
		},
	};
}

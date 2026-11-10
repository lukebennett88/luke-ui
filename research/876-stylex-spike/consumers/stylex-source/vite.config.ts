import { fileURLToPath } from 'node:url';
import stylex from '@stylexjs/unplugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
// A consumer app uses plain Vite, not this repository's Vite+ toolchain.
// oxlint-disable-next-line vite-plus/prefer-vite-plus-imports
import { defineConfig } from 'vite';

const app = process.env.APP ?? 'realistic';
const local = (path: string) => fileURLToPath(new URL(path, import.meta.url));
// The consumer configures StyleX directly. Luke UI's atoms nest under its `recipes` layer.
// `stylex.vite()` is the plugin's documented form.
// oxlint-disable-next-line import/no-named-as-default-member
const stylexPlugin = stylex.vite({ useCSSLayers: { prefix: 'luke-ui.recipes' } });

export default defineConfig({
	build: { outDir: `dist/${app}` },
	plugins: [
		// `SPIKE_OMIT_STYLEX=1` drops the plugin to record what a misconfigured consumer sees.
		process.env.SPIKE_OMIT_STYLEX !== '1' && stylexPlugin,
		// Dev only: the StyleX plugin serves its CSS from a virtual stylesheet. Production builds
		// append the CSS to the app's CSS asset instead.
		{
			apply: 'serve',
			name: 'stylex-dev-stylesheet',
			transformIndexHtml: () => [
				{
					attrs: { href: '/virtual:stylex.css', rel: 'stylesheet' },
					injectTo: 'head',
					tag: 'link',
				},
			],
		},
		react(),
		app === 'tailwind' && tailwindcss(),
	],
	resolve: {
		alias: {
			'#app': local(`../shared/src/${app}.tsx`),
			'#styles': local(app === 'tailwind' ? './src/tailwind.css' : './src/styles.css'),
			'#ui': local('./src/ui'),
		},
		dedupe: ['react', 'react-dom', 'react-aria-components'],
	},
});

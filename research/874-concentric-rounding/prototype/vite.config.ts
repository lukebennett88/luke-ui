import { fileURLToPath } from 'node:url';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { defineConfig } from 'vite-plus';

const file = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
	build: {
		cssCodeSplit: true,
		minify: true,
		outDir: process.env.OUT_DIR ?? 'dist',
		rollupOptions: {
			input: ['concentric', 'baseline', 'perf-concentric', 'perf-baseline'].map((name) => {
				return file(`./${name}.html`);
			}),
		},
	},
	plugins: [vanillaExtractPlugin()],
	resolve: {
		alias: {
			'#create-runtime-fn': file(
				'../../../packages/@luke-ui/rainbow-sprinkles/src/create-runtime-fn.ts',
			),
		},
	},
});

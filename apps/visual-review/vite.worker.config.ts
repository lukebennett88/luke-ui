import type { Plugin } from 'vite-plus';
import { defineConfig } from 'vite-plus';

/**
 * Builds the review backend into `dist/_worker.js`, a Cloudflare Pages Functions worker in advanced
 * mode, after the app build. The deploy uploads `dist` from an empty directory with no
 * `node_modules`, so the worker must be one self-contained ES module.
 */
export default defineConfig({
	build: {
		emptyOutDir: false,
		lib: {
			entry: 'src/worker/index.ts',
			fileName: () => '_worker.js',
			formats: ['es'],
		},
		minify: false,
		outDir: 'dist',
		target: 'es2022',
	},
	plugins: [pagesWorker()],
	publicDir: false,
});

function pagesWorker(): Plugin {
	return {
		generateBundle(_options, bundle) {
			const chunks = Object.values(bundle).filter((output) => output.type === 'chunk');
			if (chunks.length !== 1) this.error(`Expected one worker chunk, got ${chunks.length}.`);
			for (const chunk of chunks) {
				if (chunk.imports.length > 0 || chunk.dynamicImports.length > 0) {
					this.error(`The worker must not import at runtime: ${chunk.imports.join(', ')}.`);
				}
			}
			// Only the API reaches the worker. Pages serves every other path as a static asset.
			this.emitFile({
				fileName: '_routes.json',
				source: `${JSON.stringify({ exclude: [], include: ['/api/*'], version: 1 })}\n`,
				type: 'asset',
			});
		},
		name: 'visual-review-pages-worker',
	};
}

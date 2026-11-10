import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
// A consumer app uses plain Vite, not this repository's Vite+ toolchain.
// oxlint-disable-next-line vite-plus/prefer-vite-plus-imports
import { defineConfig } from 'vite';

const app = process.env.APP ?? 'realistic';
const local = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
	build: { outDir: `dist/${app}` },
	plugins: [react(), app === 'tailwind' && tailwindcss()],
	resolve: {
		alias: {
			'#app': local(`../shared/src/${app}.tsx`),
			'#styles': local(app === 'tailwind' ? './src/tailwind.css' : './src/styles.css'),
			'#ui': local('./src/ui'),
		},
		dedupe: ['react', 'react-dom', 'react-aria-components'],
	},
});

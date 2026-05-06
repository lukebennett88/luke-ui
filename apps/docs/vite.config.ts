import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import mdx from 'fumadocs-mdx/vite';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';

export default defineConfig(async () => ({
	optimizeDeps: {
		exclude: ['@luke-ui/react'],
	},
	resolve: {
		external: ['ts-morph'],
		tsconfigPaths: true,
	},
	plugins: [
		mdx(await import('./source.config')),
		tailwindcss(),
		tanstackStart({
			pages: [{ path: '/docs' }, { path: '/api/search' }],

			spa: {
				enabled: true,
				prerender: {
					crawlLinks: true,
					enabled: true,
					outputPath: 'index.html',
				},
			},
		}),
		react(),
		nitro(),
	],
	server: {
		port: 3000,
	},
}));

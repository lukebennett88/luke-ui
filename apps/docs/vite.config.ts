import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import mdx from 'fumadocs-mdx/vite';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig(async () => ({
	optimizeDeps: {
		exclude: ['@luke-ui/react'],
	},
	plugins: [
		mdx(await import('./source.config')),
		tailwindcss(),
		tsConfigPaths({
			projects: ['./tsconfig.json'],
		}),
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
		// Please see https://tanstack.com/start/latest/docs/framework/react/guide/hosting#nitro for guides on hosting
		nitro(),
	],
	server: {
		port: 3000,
	},
}));

import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';
import { localReport, visualReviewTheme } from './vite.plugins.js';

export default defineConfig({
	plugins: [
		visualReviewTheme(),
		localReport(),
		vanillaExtractPlugin(),
		// Everything the app shows is read in the browser: reports from their own origin, and the
		// review from the Pages worker. SPA mode prerenders one shell to `dist/client/index.html`.
		tanstackStart({ spa: { enabled: true, prerender: { outputPath: '/index.html' } } }),
		react(),
	],
	server: {
		port: 5175,
	},
});

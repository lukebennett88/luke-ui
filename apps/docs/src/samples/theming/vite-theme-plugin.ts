import { defineTheme } from '@luke-ui/react/theme/compiler';
import type { Plugin } from 'vite';
import { theme } from './theme.ts';

/** Serves the compiled theme as `virtual:theme.css`. Import that id from the application entry. */
export function themePlugin(): Plugin {
	const id = 'virtual:theme.css';
	const resolvedId = `\0${id}`;
	return {
		load: (loadId) => (loadId === resolvedId ? defineTheme(theme) : undefined),
		name: 'theme',
		resolveId: (source) => (source === id ? resolvedId : undefined),
	};
}

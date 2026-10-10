import { beforeEach } from 'vite-plus/test';
import { THEME_IDENTITY_CLASS_NAMES } from '../lib/theme-prefs-shared.js';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// The docs site renders the Tactile identity on `<html>`. Tests render without the root route.
beforeEach(() => {
	document.documentElement.classList.add(THEME_IDENTITY_CLASS_NAMES.tactile);
});

import { getThemeClassName } from '@luke-ui/react/theme';
import { afterEach, beforeEach } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { visualReviewThemeInput } from '../theme/input.js';
import { cleanupApps } from './render-app.js';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// The root route puts the identity class on `<html>` in the app. Tests render without it.
document.documentElement.classList.add(getThemeClassName(visualReviewThemeInput.name));

beforeEach(async () => {
	await page.viewport(1280, 800);
});

afterEach(() => {
	cleanupApps();
	localStorage.clear();
});

import { afterEach } from 'vite-plus/test';
import { settingsApi } from '../api/settings-api.js';

afterEach(() => {
	settingsApi.reset();
	settingsApi.setLatency(0);
	document.documentElement.removeAttribute('data-color-mode');
	document.documentElement.removeAttribute('data-font-size');
	document.documentElement.removeAttribute('data-pointer-cursor');
	document.documentElement.removeAttribute('data-underline-links');
	document.documentElement.removeAttribute('data-disable-animated-images');
});

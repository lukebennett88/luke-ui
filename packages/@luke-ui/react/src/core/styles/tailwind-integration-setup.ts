import { beforeEach } from 'vite-plus/test';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Fixture CSS loads Tactile's stylesheet. Match a consumer that sets the identity on `<html>`.
beforeEach(() => {
	document.documentElement.classList.add('luke-ui-theme-tactile');
});

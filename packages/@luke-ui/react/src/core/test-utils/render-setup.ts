// Built components require the built stylesheet's class names and layer order.
import '@luke-ui/react/stylesheet.css';
import '@luke-ui/react/themes/paper/stylesheet.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { afterEach } from 'vite-plus/test';
import { cleanupMountedRenders } from './render-mount-state.js';
import { parkPointer } from './visual.js';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(async () => {
	cleanupMountedRenders();
	await parkPointer();
});

// Built components require the built stylesheet's class names and layer order.
import '@luke-ui/react/stylesheet.css';
import '@luke-ui/react/themes/paper/stylesheet.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { afterEach } from 'vite-plus/test';
import { cdp } from 'vite-plus/test/context';
import { cleanupMountedRenders } from './render-mount-state.js';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(async () => {
	cleanupMountedRenders();
	// Clear leftover `:hover` / `data-hovered` from the previous test's pointer position.
	await cdp().send('Input.dispatchMouseEvent', {
		button: 'none',
		buttons: 0,
		modifiers: 0,
		type: 'mouseMoved',
		x: 0,
		y: 0,
	});
});

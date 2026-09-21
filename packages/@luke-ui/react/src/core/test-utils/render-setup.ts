// Import the complete layer graph before component CSS so browser tests use the built
// stylesheet's layer order. Vite's dev server does not run `authoritativeLayerOrderPlugin`, and the
// browser fixes layer order when a `<style>` tag first names each layer.
import '../styles/index.css.js';
// Load the shared theme styles during setup so portal layout (open menus, trays) is
// ready before a test waits on it, rather than only becoming available once the
// first `render()` call runs its own module-level imports.
import '../stylesheet.css.js';
import '@luke-ui/react/themes/paper/stylesheet.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { afterEach } from 'vite-plus/test';
import { cleanupMountedRenders } from './render-mount-state.js';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Unmount everything rendered by `render` after each test, so individual test
// files never have to remember to clean up. Every hand-rolled React mount goes
// through `render`, so one cleanup covers both behavioural and visual cases.
afterEach(() => {
	cleanupMountedRenders();
});

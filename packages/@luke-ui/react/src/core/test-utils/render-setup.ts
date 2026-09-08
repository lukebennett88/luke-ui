// Import the complete layer graph before component CSS so browser and visual tests use the built
// stylesheet's layer order. Vite's dev server does not run `authoritativeLayerOrderPlugin`, and the
// browser fixes layer order when a `<style>` tag first names each layer.
import '../styles/index.css.js';
import { afterEach } from 'vite-plus/test';
import { cleanupMountedRenders } from './render-mount-state.js';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Unmount everything rendered by `render` after each test, so individual test
// files never have to remember to clean up. Shared by the `browser` and
// `visual` Vitest projects — every hand-rolled React mount goes through
// `render`, so one cleanup covers both.
afterEach(() => {
	cleanupMountedRenders();
});

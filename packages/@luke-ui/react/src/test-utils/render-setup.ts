import { afterEach } from 'vite-plus/test';
import { cleanupMountedRenders } from './render.js';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Unmount everything rendered by `render` after each test, so individual test
// files never have to remember to clean up. Shared by the `browser` and
// `visual` Vitest projects — every hand-rolled React mount goes through
// `render`, so one cleanup covers both.
afterEach(() => {
	cleanupMountedRenders();
});

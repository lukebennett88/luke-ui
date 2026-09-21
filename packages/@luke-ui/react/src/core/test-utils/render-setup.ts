// Tests import components from the built package, so they must load the package's
// own stylesheet: the source `.css.ts` modules compile to different hashed class
// names than the ones baked into `dist`, and loading those instead leaves every
// built component unstyled. This also carries the built layer order, which Vite's
// dev server does not reproduce (it never runs `authoritativeLayerOrderPlugin`).
import '@luke-ui/react/stylesheet.css';
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

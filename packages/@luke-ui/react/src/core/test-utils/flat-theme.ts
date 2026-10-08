import { defineTheme } from '@luke-ui/react/theme';
import { theme as tactileTheme } from '@luke-ui/react/themes/tactile';

const NO_DEPTH = {
	floating: 'none',
	overlay: 'none',
	raised: 'none',
	recessed: 'none',
	resting: 'none',
};
const NO_FINISH = { raised: 'none', recessed: 'none', resting: 'none' };

/** The flat fixture's identity class. `defineTheme` derives it from the fixture name. */
export const flatThemeClassName = 'luke-ui-theme-flat-fixture';

/**
 * Builds the flat fixture: Tactile's colours with every `depth` and `controlFinish` value set to
 * `none`. A state that only a material distinguishes looks identical to its neighbour here, so
 * captures in this theme catch a component that depends on materials for an essential distinction.
 */
export function buildFlatThemeStylesheet(): string {
	return defineTheme({
		controlFinish: { dark: NO_FINISH, light: NO_FINISH },
		depth: { dark: NO_DEPTH, light: NO_DEPTH },
		extends: tactileTheme,
		name: 'flat-fixture',
	});
}

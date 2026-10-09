import type { ExtendingThemeInput } from '@luke-ui/react/theme/compiler';
import { tactileTheme } from '../../theme/__fixtures__/tactile.js';

const NO_DEPTH = {
	floating: 'none',
	overlay: 'none',
	raised: 'none',
	recessed: 'none',
	resting: 'none',
};
const NO_FINISH = { raised: 'none', recessed: 'none', resting: 'none' };

/** The flat fixture: Tactile's colours with every `depth` and `controlFinish` value `none`. */
export const flatTheme: ExtendingThemeInput = {
	controlFinish: { dark: NO_FINISH, light: NO_FINISH },
	depth: { dark: NO_DEPTH, light: NO_DEPTH },
	extends: tactileTheme,
	name: 'flat-fixture',
};

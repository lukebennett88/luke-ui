import type { ThemeInput } from '@luke-ui/react/theme/compiler';
import { tactileTheme } from '../../theme/__fixtures__/tactile.js';

const NO_SHADOW = {
	floating: 'none',
	overlay: 'none',
	raised: 'none',
	inset: 'none',
	resting: 'none',
};
const NO_FINISH = { raised: 'none', recessed: 'none', resting: 'none' };

/** The flat fixture: Tactile's colours with every `shadow` and `controlFinish` value `none`. */
export const flatTheme: ThemeInput = {
	...tactileTheme,
	controlFinish: { dark: NO_FINISH, light: NO_FINISH },
	shadow: { dark: NO_SHADOW, light: NO_SHADOW },
	name: 'flat-fixture',
};

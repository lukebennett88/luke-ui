import { lukeUiClassNames } from '../styles/class-names.js';
import { cx } from '../utils.js';
import { themeClass } from './theme.css.js';

export { themeClass, vars } from './theme.css.js';

export const themeRootClassName = cx(
	themeClass,
	lukeUiClassNames.themeRoot,
	lukeUiClassNames.resetRoot,
);

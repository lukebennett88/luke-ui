import { lukeUiClassNames } from '../styles/class-names.js';
import { themeClass } from '../theme.css.js';
import { cx } from '../utils/index.js';

export { themeClass, vars } from '../theme.css.js';

export const themeRootClassName = cx(
	themeClass,
	lukeUiClassNames.themeRoot,
	lukeUiClassNames.resetRoot,
);

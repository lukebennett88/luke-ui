import { lukeUiClassNames } from '../styles/class-names.js';
import { cx } from '../utils/utils.js';

/**
 * Applies the descendant CSS reset and the base Luke UI typography and theme layer. It carries no
 * theme identity of its own. Apply it to `<body>`, `<main>`, an app shell, or any element you
 * already own.
 */
export const rootClassName = cx(lukeUiClassNames.themeRoot, lukeUiClassNames.resetRoot);

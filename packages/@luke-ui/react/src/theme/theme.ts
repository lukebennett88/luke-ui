import { lukeUiClassNames } from '../shared/class-names.js';
import { cx } from '../shared/utils/utils.js';

/**
 * Applies the descendant CSS reset and Luke UI's root base colour and body typography. It carries
 * no theme identity of its own. Apply it to `<body>`, `<main>`, an app shell, or any element you
 * already own.
 */
export const rootClassName = cx(lukeUiClassNames.themeRoot, lukeUiClassNames.resetRoot);

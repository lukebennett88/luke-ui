import type { Context } from 'react';
import * as HiddenModule from 'react-aria/private/collections/Hidden';

/**
 * React Aria's published types for `react-aria/private/collections/Hidden` only expose
 * `createHideableComponent` and `useIsHidden`. The implementation still exports `HiddenContext`,
 * and vitest aliases that entry to the private module so tests share the same context instance as
 * React Aria Components.
 */
export const HiddenContext = (
	HiddenModule as typeof HiddenModule & { HiddenContext: Context<boolean> }
).HiddenContext;

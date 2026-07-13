import { createGlobalThemeContract } from '@vanilla-extract/css';
import { kebabCaseSegment, themeContractTree } from './contract.js';

/**
 * Typed access to the semantic theme custom properties. Each path resolves to a stable global
 * `--luke-*` variable reference, for example `vars.color.intent.danger.surface.solidHover` is
 * `var(--luke-color-intent-danger-surface-solid-hover)`. Emits no CSS; values are supplied by a
 * theme stylesheet built with `buildTheme`.
 */
export const vars = createGlobalThemeContract(
	themeContractTree,
	(_value, path) => `luke-${path.map(kebabCaseSegment).join('-')}`,
);

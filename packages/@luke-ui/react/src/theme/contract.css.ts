import { themeContractTree, themeVarName } from './contract.js';

/**
 * Recursively walks the contract tree and builds a same-shape object where each leaf holds its
 * stable `var(--luke-*)` reference. This replaces `createGlobalThemeContract` so the public `vars`
 * shape is fully source-owned and free of styling-engine types.
 */
function buildVars(
	node: Record<string, unknown>,
	segments: Array<string> = [],
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(node)) {
		const path = [...segments, key];
		if (value === null) {
			result[key] = `var(${themeVarName(path)})`;
		} else {
			result[key] = buildVars(value as Record<string, unknown>, path);
		}
	}
	return result;
}

type ContractVars<T> = {
	[K in keyof T]: T[K] extends null
		? string
		: T[K] extends Record<string, unknown>
			? ContractVars<T[K]>
			: never;
};

/**
 * Typed access to the semantic theme custom properties. Each path resolves to a stable global
 * `--luke-*` variable reference, for example `vars.color.intent.danger.surface.solidHover` is
 * `var(--luke-color-intent-danger-surface-solid-hover)`. Emits no CSS; values are supplied by a
 * theme stylesheet built with `buildTheme`.
 */
export const vars = buildVars(themeContractTree) as ContractVars<typeof themeContractTree>;

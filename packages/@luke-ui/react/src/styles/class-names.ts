export const lukeUiClassNames = {
	resetRoot: 'luke-ui-reset',
	themeRoot: 'luke-ui-theme',
} as const;

export function classSelector<TClassName extends string>(
	className: TClassName,
): `.${TClassName}` {
	return `.${className}`;
}

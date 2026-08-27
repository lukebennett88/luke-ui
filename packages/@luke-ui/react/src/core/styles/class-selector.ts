/** Builds a CSS class selector (`.foo`) from a class name, typed to preserve the literal. */
export function classSelector<TClassName extends string>(className: TClassName): `.${TClassName}` {
	return `.${className}`;
}

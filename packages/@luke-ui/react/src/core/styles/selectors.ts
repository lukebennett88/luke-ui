/** Builds a CSS class selector (`.foo`) from a class name, typed to preserve the literal. */
export function classSelector<TClassName extends string>(className: TClassName): `.${TClassName}` {
	return `.${className}`;
}

/** Builds a CSS attribute selector (`[foo]`) from an attribute name, typed to preserve the literal. */
export function attributeSelector<TAttribute extends string>(
	attribute: TAttribute,
): `[${TAttribute}]` {
	return `[${attribute}]`;
}

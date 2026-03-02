type StylePrimitive = string | number;

export function createVariants<
	Key extends string,
	Style extends Record<string, StylePrimitive>,
>(keys: ReadonlyArray<Key>, getStyle: (key: Key) => Style): Record<Key, Style> {
	const styles = {} as Record<Key, Style>;
	for (const key of keys) {
		styles[key] = getStyle(key);
	}
	return styles;
}

export function createPropertyVariants<
	Key extends string,
	Property extends string,
>(
	keys: ReadonlyArray<Key>,
	property: Property,
	values: Record<Key, string>,
): Record<Key, Record<Property, string>> {
	return createVariants(keys, (key) => ({
		[property]: values[key],
	})) as Record<Key, Record<Property, string>>;
}

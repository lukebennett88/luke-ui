/**
 * Immediate shorthand → longhand edges for equal-specificity utility classes.
 * Broader properties must be emitted before narrower ones so a longhand wins in the cascade.
 */
const SHORTHAND_LONGHANDS: Record<string, ReadonlyArray<string>> = {
	flex: ['flexBasis', 'flexGrow', 'flexShrink'],
	gap: ['columnGap', 'rowGap'],
	gridArea: ['gridColumn', 'gridRow'],
	gridColumn: ['gridColumnEnd', 'gridColumnStart'],
	gridRow: ['gridRowEnd', 'gridRowStart'],
	inset: ['insetBlock', 'insetInline'],
	insetBlock: ['insetBlockEnd', 'insetBlockStart'],
	insetInline: ['insetInlineEnd', 'insetInlineStart'],
	margin: ['marginBlock', 'marginInline'],
	marginBlock: ['marginBlockEnd', 'marginBlockStart'],
	marginInline: ['marginInlineEnd', 'marginInlineStart'],
	overflow: ['overflowX', 'overflowY'],
	padding: ['paddingBlock', 'paddingInline'],
	paddingBlock: ['paddingBlockEnd', 'paddingBlockStart'],
	paddingInline: ['paddingInlineEnd', 'paddingInlineStart'],
	placeSelf: ['alignSelf', 'justifySelf'],
};

const PARENTS_BY_PROPERTY = (() => {
	const parents = new Map<string, Array<string>>();
	for (const [shorthand, longhands] of Object.entries(SHORTHAND_LONGHANDS)) {
		for (const longhand of longhands) {
			const existing = parents.get(longhand);
			if (existing) existing.push(shorthand);
			else parents.set(longhand, [shorthand]);
		}
	}
	return parents;
})();

/**
 * Sort CSS property names so broader shorthands come before overlapping narrower properties.
 * Unrelated properties keep their relative input order.
 */
export function orderPropertiesBySpecificity(properties: ReadonlyArray<string>): Array<string> {
	const configured = new Set(properties);
	const depthCache = new Map<string, number>();

	function depth(property: string): number {
		const cached = depthCache.get(property);
		if (cached !== undefined) return cached;

		let maxConfiguredAncestorDepth = -1;
		const stack = [...(PARENTS_BY_PROPERTY.get(property) ?? [])];
		const seen = new Set<string>();

		while (stack.length > 0) {
			const ancestor = stack.pop();
			if (ancestor === undefined || seen.has(ancestor)) continue;
			seen.add(ancestor);

			if (configured.has(ancestor)) {
				maxConfiguredAncestorDepth = Math.max(maxConfiguredAncestorDepth, depth(ancestor));
				continue;
			}

			for (const next of PARENTS_BY_PROPERTY.get(ancestor) ?? []) {
				stack.push(next);
			}
		}

		const value = maxConfiguredAncestorDepth + 1;
		depthCache.set(property, value);
		return value;
	}

	return properties
		.map((property, index) => ({ depth: depth(property), index, property }))
		.sort((left, right) => left.depth - right.depth || left.index - right.index)
		.map(({ property }) => property);
}

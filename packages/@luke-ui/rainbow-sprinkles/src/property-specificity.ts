/**
 * Immediate shorthand → narrower-property edges for equal-specificity utility classes.
 * Broader properties must be emitted before overlapping narrower ones so a longhand wins
 * within the same condition.
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

const PARENTS_BY_PROPERTY = new Map<string, Array<string>>();
for (const [shorthand, longhands] of Object.entries(SHORTHAND_LONGHANDS)) {
	for (const longhand of longhands) {
		const parents = PARENTS_BY_PROPERTY.get(longhand);
		if (parents) parents.push(shorthand);
		else PARENTS_BY_PROPERTY.set(longhand, [shorthand]);
	}
}

/** Depth among configured properties: roots are 0, each overlapping narrower property is deeper. */
function depthAmongConfigured(
	property: string,
	configured: ReadonlySet<string>,
	depths: Map<string, number>,
): number {
	const cached = depths.get(property);
	if (cached !== undefined) return cached;

	let depth = 0;
	const stack = [...(PARENTS_BY_PROPERTY.get(property) ?? [])];
	const seen = new Set<string>();

	while (stack.length > 0) {
		const ancestor = stack.pop();
		if (ancestor === undefined || seen.has(ancestor)) continue;
		seen.add(ancestor);

		if (configured.has(ancestor)) {
			depth = Math.max(depth, depthAmongConfigured(ancestor, configured, depths) + 1);
			continue;
		}

		for (const next of PARENTS_BY_PROPERTY.get(ancestor) ?? []) {
			stack.push(next);
		}
	}

	depths.set(property, depth);
	return depth;
}

/**
 * Sort CSS property names so broader shorthands come before overlapping narrower properties.
 * Unrelated properties may move relative to each other across depth buckets.
 */
export function orderPropertiesBySpecificity(properties: ReadonlyArray<string>): Array<string> {
	const configured = new Set(properties);
	const depths = new Map<string, number>();
	const buckets = new Map<number, Array<string>>();
	let maxDepth = 0;

	for (const property of properties) {
		const depth = depthAmongConfigured(property, configured, depths);
		maxDepth = Math.max(maxDepth, depth);

		const bucket = buckets.get(depth);
		if (bucket) bucket.push(property);
		else buckets.set(depth, [property]);
	}

	const ordered: Array<string> = [];
	for (let depth = 0; depth <= maxDepth; depth++) {
		const bucket = buckets.get(depth);
		if (!bucket) continue;
		for (const property of bucket) ordered.push(property);
	}
	return ordered;
}

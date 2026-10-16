import type { DocEntry, GeneratedDoc } from 'fumadocs-typescript';

const OUTER_UNDEFINED_SUFFIX = ' | undefined';

/**
 * Drop the outermost `| undefined` TypeScript adds for optional properties. Leaves nested
 * `| undefined` inside generics or parentheses alone.
 */
export function stripOuterUndefined(type: string): string {
	return type.endsWith(OUTER_UNDEFINED_SUFFIX)
		? type.slice(0, -OUTER_UNDEFINED_SUFFIX.length)
		: type;
}

/**
 * Restore readable declared types when fumadocs collapses an optional alias-of-union to `union`,
 * and strip the redundant outer `| undefined` from optional prop type strings.
 */
export function improveGeneratedDocTypes(doc: GeneratedDoc): GeneratedDoc {
	return {
		...doc,
		entries: doc.entries.map(improveDocEntry),
	};
}

function improveDocEntry(entry: DocEntry): DocEntry {
	const type = entry.required ? entry.type : stripOuterUndefined(entry.type);
	const simplifiedType =
		!entry.required && entry.simplifiedType === 'union' && type.length > 0 && type !== 'union'
			? type
			: entry.simplifiedType;

	if (type === entry.type && simplifiedType === entry.simplifiedType) return entry;
	return { ...entry, simplifiedType, type };
}

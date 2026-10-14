import type { GeneratedDoc, Generator } from 'fumadocs-typescript';

const OPENING_BRACKETS = new Set(['(', '[', '{', '<']);
const CLOSING_BRACKETS = new Set([')', ']', '}', '>']);
const QUOTES = new Set(['"', "'", '`']);

/**
 * Splits a type string on its top-level `|` separators. Unions nested in generics, tuples, object
 * types, parentheses, or string literals stay inside their member.
 */
function splitTopLevelUnion(type: string): Array<string> {
	const members: Array<string> = [];
	let depth = 0;
	let quote: string | undefined;
	let memberStart = 0;

	for (let index = 0; index < type.length; index += 1) {
		const char = type.charAt(index);
		if (quote !== undefined) {
			if (char === '\\') index += 1;
			else if (char === quote) quote = undefined;
			continue;
		}
		if (QUOTES.has(char)) quote = char;
		else if (OPENING_BRACKETS.has(char)) depth += 1;
		// The `>` of an arrow function is not a closing angle bracket.
		else if (CLOSING_BRACKETS.has(char) && !(char === '>' && type.charAt(index - 1) === '='))
			depth -= 1;
		else if (char === '|' && depth === 0) {
			members.push(type.slice(memberStart, index).trim());
			memberStart = index + 1;
		}
	}

	members.push(type.slice(memberStart).trim());
	return members.filter((member) => member !== '');
}

/** Whether the first `(` of `member` closes at its last character. */
function isWrappedInParentheses(member: string): boolean {
	if (!member.startsWith('(') || !member.endsWith(')')) return false;
	let depth = 0;
	for (let index = 0; index < member.length; index += 1) {
		const char = member.charAt(index);
		if (char === '(') depth += 1;
		else if (char === ')') depth -= 1;
		if (depth === 0) return index === member.length - 1;
	}
	return false;
}

/**
 * Removes a top-level `undefined` member from a union type string. A lone remaining function type
 * also loses the parentheses the union needed. Anything else comes back unchanged.
 */
export function stripUndefinedMember(type: string): string {
	const members = splitTopLevelUnion(type);
	const kept = members.filter((member) => member !== 'undefined');
	if (kept.length === 0 || kept.length === members.length) return type;

	const [only] = kept;
	if (kept.length === 1 && only !== undefined) {
		return isWrappedInParentheses(only) ? only.slice(1, -1).trim() : only;
	}
	return kept.join(' | ');
}

/** Drops the redundant `undefined` from optional entries. Optionality is already marked. */
function stripOptionalEntries(doc: GeneratedDoc): GeneratedDoc {
	return {
		...doc,
		entries: doc.entries.map((entry) =>
			entry.required === false ? { ...entry, type: stripUndefinedMember(entry.type) } : entry,
		),
	};
}

/** Patches a generator so every optional prop's displayed type omits `| undefined`. */
export function stripOptionalUndefined<T extends Generator>(generator: T): T {
	const generateDocumentation = generator.generateDocumentation.bind(generator);
	generator.generateDocumentation = async (file, name, options) => {
		const docs = await generateDocumentation(file, name, options);
		return docs.map(stripOptionalEntries);
	};
	return generator;
}

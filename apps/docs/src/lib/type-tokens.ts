/**
 * Syntax classes of a type token: keyword, other literal (number, boolean), property or parameter
 * name, string literal, and type name.
 */
export const TYPE_TOKEN_KINDS = ['k', 'l', 'p', 's', 't'] as const;

export type TypeTokenKind = (typeof TYPE_TOKEN_KINDS)[number];

/**
 * One piece of a formatted TypeScript type. A string is punctuation or whitespace. A number is a line
 * break followed by that many indentation levels. A tuple is classified text, and its third item is
 * the definitions key a type name refers to.
 *
 * The build formats types into tokens once, so the browser, processed Markdown, and popovers all
 * show the same text and line breaks without parsing TypeScript.
 */
export type TypeToken = number | string | [TypeTokenKind, string] | [TypeTokenKind, string, string];

export type TypeTokens = ReadonlyArray<TypeToken>;

/**
 * Brackets that sit against their neighbours when a line break becomes inline text. Braces keep a
 * space inside, as TypeScript prints object types.
 */
const OPENING_PUNCTUATION_PATTERN = /[([<]$/;
const CLOSING_PUNCTUATION_PATTERN = /^[)\]>]/;
const OPERATOR_GLUE_PATTERN = /\u2060?\u00a0/g;

/** Indentation per level, matching the two spaces React Aria's type renderer uses. */
const INDENT = '  ';

/**
 * The tokens as text. `multiline` keeps the formatted line breaks, as code blocks show them. Without
 * it, each break becomes a space, or nothing inside parentheses, brackets, and angle brackets, for a single line
 * such as a Markdown table cell. The word joiners and no-break spaces that keep an operator with its
 * member become ordinary spaces, so copied text is plain TypeScript.
 */
export function typeTokensToText(
	tokens: TypeTokens,
	{ multiline }: { multiline: boolean },
): string {
	let text = '';
	for (const [index, token] of tokens.entries()) {
		if (typeof token !== 'number') {
			text += (typeof token === 'string' ? token : token[1]).replace(OPERATOR_GLUE_PATTERN, ' ');
			continue;
		}
		if (multiline) {
			text += `\n${INDENT.repeat(token)}`;
			continue;
		}
		const next = tokens[index + 1];
		const nextText = typeof next === 'number' || next === undefined ? '' : tokenText(next);
		if (!OPENING_PUNCTUATION_PATTERN.test(text) && !CLOSING_PUNCTUATION_PATTERN.test(nextText)) {
			text += ' ';
		}
	}
	return text;
}

/** The whitespace a line-break token renders as. */
export function lineBreakText(depth: number): string {
	return `\n${INDENT.repeat(depth)}`;
}

function tokenText(token: Exclude<TypeToken, number>): string {
	return typeof token === 'string' ? token : token[1];
}

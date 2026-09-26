// Deterministic, regex-based prose conventions. A mechanical rule belongs here. A rule that needs
// semantic judgement to apply correctly does not belong in an automated check at all; it stays
// documentation guidance instead. See extractProseForRules below for what "prose" means for these
// patterns.

/** One mechanically checkable prose rule: a regex and the label its hit is reported under. */
interface ProseRule {
	readonly label: string;
	readonly pattern: RegExp;
}

export const PROSE_RULES: ReadonlyArray<ProseRule> = [
	{ label: 'prose semicolon', pattern: /;/ },
	{ label: '"assistive technologies"', pattern: /\bassistive\s+technologies\b/i },
	{ label: 'unspaced em dash', pattern: /[^ \n]—|—[^ \n]/ },
	{ label: 'filler "simply"', pattern: /\bsimply\b/i },
	{ label: 'filler "note that"', pattern: /\bnote\s+that\b/i },
	{ label: 'filler "it is important to"', pattern: /\bit\s+is\s+important\s+to\b/i },
	{ label: 'filler "allows you to"', pattern: /\ballows\s+you\s+to\b/i },
	{ label: 'filler "enables you to"', pattern: /\benables\s+you\s+to\b/i },
	{ label: 'filler "can be used to"', pattern: /\bcan\s+be\s+used\s+to\b/i },
	{ label: 'filler "seamless"', pattern: /\bseamless\b/i },
	{ label: 'first-person "we"', pattern: /\bwe\b/i },
	{ label: 'first-person "us"', pattern: /\bus\b/ },
	{ label: 'first-person "let\'s"', pattern: /\blet's\b/i },
	{ label: 'terminology "users"', pattern: /\busers\b/i },
	{ label: 'terminology "the user"', pattern: /\bthe\s+user\b/i },
	{ label: 'terminology "a person"', pattern: /\ba\s+person\b/i },
	{ label: 'terminology "people"', pattern: /\bpeople\b/i },
];

/** Every rule in `PROSE_RULES` that matches `prose`, as `<label>` strings ready to be prefixed with
 * a file's relative path by the caller. */
export function findProseRuleLabels(prose: string): Array<string> {
	const labels: Array<string> = [];
	for (const rule of PROSE_RULES) {
		if (rule.pattern.test(prose)) labels.push(rule.label);
	}
	return labels;
}

const FRONTMATTER_STRIP_PATTERN = /^---\n[\s\S]*?\n---\n/;
const FENCED_CODE_PATTERN = /```[\s\S]*?```/g;
const INLINE_CODE_PATTERN = /`[^`]*`/g;
const HTML_ENTITY_PATTERN = /&[a-zA-Z]+;|&#\d+;/g;
const IMPORT_EXPORT_LINE_PATTERN = /^(?:import|export)\b.*$/gm;
// A single-line JSX/MDX tag: `<Name ...attrs.../>`, `<Name ...attrs>`, or `</Name>`. Attribute
// values may contain `>` inside quotes or `{...}` braces, so those are matched as alternatives
// rather than stopping at the first `>`. Multi-line tags are left in place, uncaptured: matching a
// tag whose attributes span several lines needs a brace/quote-tracking scanner rather than a
// single regex, which is a lot of machinery for a rare shape in this corpus, so a false negative
// on a multi-line tag is the accepted trade-off for staying a single, simple pattern.
const JSX_TAG_LINE_PATTERN =
	/<\/?[A-Za-z][\w.-]*(?:\s+[\w-]+(?:=(?:"[^"]*"|'[^']*'|\{[^{}]*\}))?)*\s*\/?>/g;

/**
 * Isolates prose for the deterministic rules above: strips frontmatter, fenced and inline code,
 * HTML entities (so `&mdash;` cannot read as an unspaced em dash), single-line import/export
 * statements, and single-line JSX/MDX tags. A hard-wrapped phrase still needs to read as one
 * sentence after this strip, so this only removes markup and code, never prose whitespace.
 */
export function extractProseForRules(source: string): string {
	return stripJsxTagLines(
		stripImportExportLines(
			stripHtmlEntities(stripInlineCode(stripFencedCode(stripFrontmatter(source)))),
		),
	);
}

function stripFrontmatter(source: string): string {
	return source.replace(FRONTMATTER_STRIP_PATTERN, '');
}

function stripFencedCode(source: string): string {
	return source.replace(FENCED_CODE_PATTERN, '');
}

function stripInlineCode(source: string): string {
	return source.replace(INLINE_CODE_PATTERN, ' ');
}

function stripHtmlEntities(source: string): string {
	return source.replace(HTML_ENTITY_PATTERN, ' ');
}

function stripImportExportLines(source: string): string {
	return source.replace(IMPORT_EXPORT_LINE_PATTERN, '');
}

function stripJsxTagLines(source: string): string {
	return source.replace(JSX_TAG_LINE_PATTERN, ' ');
}

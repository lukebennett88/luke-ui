import { expect, test } from 'vite-plus/test';
import { PROSE_RULES, extractProseForRules, findProseRuleLabels } from './docs-prose-rules.js';

test('every rule in PROSE_RULES has a hit case', () => {
	const hitCaseByLabel: Record<string, string> = {
		'"assistive technologies"': 'The spinner is hidden from assistive technologies.',
		'filler "allows you to"': 'This allows you to configure it.',
		'filler "can be used to"': 'This can be used to configure it.',
		'filler "enables you to"': 'This enables you to configure it.',
		'filler "it is important to"': 'It is important to configure it.',
		'filler "note that"': 'Note that this changes behaviour.',
		'filler "seamless"': 'The integration is seamless.',
		'filler "simply"': 'Simply configure it.',
		'first-person "let\'s"': "Let's configure it.",
		'first-person "us"': 'This gives us control.',
		'first-person "we"': 'We configure it here.',
		'prose semicolon': 'Configure it; then run it.',
		'terminology "a person"': 'A person can configure it.',
		'terminology "people"': 'People can configure it.',
		'terminology "the user"': 'The user can configure it.',
		'terminology "users"': 'Users can configure it.',
		'unspaced em dash': 'Configure it—then run it.',
	};

	for (const rule of PROSE_RULES) {
		const hitCase = hitCaseByLabel[rule.label];
		expect(hitCase, `no hit case declared for rule "${rule.label}"`).toBeDefined();
		expect(rule.pattern.test(hitCase ?? '')).toBe(true);
	}
});

test('findProseRuleLabels reports every rule that hits, in PROSE_RULES order', () => {
	expect(findProseRuleLabels('We configure it; simply run it.')).toEqual([
		'prose semicolon',
		'filler "simply"',
		'first-person "we"',
	]);
});

test('findProseRuleLabels reports nothing for clean prose', () => {
	expect(findProseRuleLabels('Configure it, then run it.')).toEqual([]);
});

test('an em dash with a space on each side is not reported', () => {
	expect(findProseRuleLabels('Configure it — then run it.')).toEqual([]);
});

test('a hard-wrapped filler phrase is still caught across a line break', () => {
	expect(findProseRuleLabels('Note\nthat this changes behaviour.')).toEqual(['filler "note that"']);
});

test('a hard-wrapped terminology phrase is still caught across a line break', () => {
	expect(findProseRuleLabels('Configure it for the\nuser before you continue.')).toEqual([
		'terminology "the user"',
	]);
});

test('"us" stays case-sensitive so it does not match inside another word', () => {
	expect(findProseRuleLabels('This uses the default configuration.')).toEqual([]);
});

for (const proseCase of [
	{
		expected: [] as ReadonlyArray<string>,
		name: 'strips an HTML entity so &mdash; is not read as an unspaced em dash',
		source: 'Use the &mdash; entity here.',
	},
	{
		expected: [],
		name: 'strips inline code so a banned word inside it is not reported',
		source: 'Call `we.simply()` to configure it.',
	},
	{
		expected: [],
		name: 'strips a JSX attribute value so a banned word inside it is not reported',
		source: '<Callout title="We simply note that this works" />',
	},
	{
		expected: [],
		name: 'strips a single-line import line so a banned word in a binding name is not reported',
		source: "import { we, us } from './data';\n\nConfigure it.",
	},
	{
		expected: [],
		name: 'strips fenced code so a banned word inside a code sample is not reported',
		source: "```tsx\nconst users = ['we', 'us'];\n```\n\nConfigure it.",
	},
	{
		expected: [],
		name: 'strips frontmatter so a banned word in a title is not reported',
		source: '---\ntitle: We simply note that\n---\n\nConfigure it.',
	},
	{
		expected: ['prose semicolon'],
		name: 'leaves ordinary prose outside code, tags, and imports intact',
		source:
			"import { Foo } from './foo';\n\nThis prose keeps its semicolon; it should still be reported.\n\n<Foo />",
	},
]) {
	test(`extractProseForRules ${proseCase.name}`, () => {
		expect(findProseRuleLabels(extractProseForRules(proseCase.source))).toEqual(proseCase.expected);
	});
}

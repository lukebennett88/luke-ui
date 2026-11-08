import { RuleTester } from 'vite-plus/lint/plugins-dev';
import { describe, it } from 'vite-plus/test';
import plugin from './lint-plugin.js';

RuleTester.describe = describe;
RuleTester.it = it;

const rule = plugin.rules['no-leading-issue-reference'];
if (!rule) throw new Error('The plugin does not define no-leading-issue-reference.');

const error = { messageId: 'leadingIssueReference' };

new RuleTester().run('no-leading-issue-reference', rule, {
	valid: [
		'// Run the suite with the command in TESTING.md.\nconst a = 1;',
		'// See #1022 for the trade-off.\nconst a = 1;',
		'// #region Fixtures\nconst a = 1;',
		"const colour = '#fff'; // #fff matches the canvas",
		'/** Documents #12 inside the sentence. */\nconst a = 1;',
	],
	invalid: [
		{ code: '// #1022 found the ring matching the panel.\nconst a = 1;', errors: [error] },
		{ code: '/** #899 asks text Links to stay underlined. */\nconst a = 1;', errors: [error] },
		{ code: '/*\n * #955 decision 8 gates the ring.\n */\nconst a = 1;', errors: [error] },
	],
});

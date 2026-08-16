import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vite-plus/test';
import { exampleBlockSources } from './example-block-sources.js';

test('reads src from a multi-line ExampleBlock tag', () => {
	expect(
		exampleBlockSources(`<ExampleBlock
	src="overview/concentric-radius"
	title="Token reference — Keep nested corners concentric"
/>`),
	).toEqual(['overview/concentric-radius']);
});

test('reads every ExampleBlock src on the token-reference page', () => {
	const contents = readFileSync(
		resolve(import.meta.dirname, '../../content/docs/docs/token-reference.mdx'),
		'utf8',
	);

	expect(exampleBlockSources(contents)).toEqual([
		'theming/semantic-variables',
		'overview/spacing-scale',
		'overview/radius-roles',
		'overview/concentric-radius',
		'overview/depth',
	]);
});

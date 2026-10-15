import { expect, test } from 'vite-plus/test';
import { exampleBlockSources } from './example-block-sources.js';

test('reads src from a multi-line ExampleBlock tag', () => {
	expect(
		exampleBlockSources(`<ExampleBlock
	src="overview/role-colours"
	title="Colour: Roles and modes"
/>`),
	).toEqual(['overview/role-colours']);
});

test('does not take src from later markup after an ExampleBlock with no src', () => {
	expect(
		exampleBlockSources(`<ExampleBlock title="Missing src" />
<SomethingElse src="not-an-example" />`),
	).toEqual([]);
});

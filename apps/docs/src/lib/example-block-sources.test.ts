import { expect, test } from 'vite-plus/test';
import { exampleBlockSources } from './example-block-sources.js';

test('reads src from a multi-line ExampleBlock tag', () => {
	expect(
		exampleBlockSources(`<ExampleBlock
	src="overview/radius-roles"
	title="Token reference: Radius roles"
/>`),
	).toEqual(['overview/radius-roles']);
});

test('does not take src from later markup after an ExampleBlock with no src', () => {
	expect(
		exampleBlockSources(`<ExampleBlock title="Missing src" />
<SomethingElse src="not-an-example" />`),
	).toEqual([]);
});

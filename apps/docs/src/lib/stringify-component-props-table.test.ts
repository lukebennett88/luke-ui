import { loader } from 'fumadocs-core/source';
import { expect, test } from 'vite-plus/test';
import { docs as docsCollection } from '../../.source/server.js';
import { NATIVE_PROPS_FORWARDING_KEY } from './component-prop-groups.js';
import { stringifyComponentPropsTable } from './stringify-component-props-table.js';

const source = loader({
	baseUrl: '/',
	source: docsCollection.toFumadocsSource(),
});

test('component-props-table through Fumadocs MDX becomes processed Markdown props tables', async () => {
	const page = source.getPage(['components', 'actions', 'button']);
	expect(page).toBeDefined();

	const processed = await page!.data.getText('processed');
	const api = processed.slice(processed.indexOf('## API'));

	expect(api).toContain('### ButtonProps');
	expect(api).toContain('| Prop');
	expect(api).toContain('`appearance?`');
	expect(api).toContain(
		'`ButtonProps` also accepts compatible DOM and ARIA attributes and event handlers for its rendered element.',
	);
	expect(api).not.toContain('ComponentPropsTable');
	expect(api).not.toContain('<component-props-table');
	expect(api).not.toContain('"entries"');
	expect(api).not.toContain(NATIVE_PROPS_FORWARDING_KEY);
});

test('stringify leaves unrelated nodes to the default Fumadocs stringifier', () => {
	expect(
		stringifyComponentPropsTable({
			attributes: [],
			name: 'ExampleBlock',
			type: 'mdxJsxFlowElement',
		} as { type: string }),
	).toBeUndefined();
	expect(stringifyComponentPropsTable({ type: 'paragraph' })).toBeUndefined();
});

test('stringify throws when ComponentPropsTable has no GeneratedDoc JSON on `type`', () => {
	expect(() =>
		stringifyComponentPropsTable({
			attributes: [],
			name: 'ComponentPropsTable',
			type: 'mdxJsxFlowElement',
		} as { type: string }),
	).toThrow(/requires a `type` attribute with GeneratedDoc JSON/);
});

test('stringify throws when ComponentPropsTable `type` is not valid GeneratedDoc JSON', () => {
	expect(() =>
		stringifyComponentPropsTable({
			attributes: [
				{
					name: 'type',
					type: 'mdxJsxAttribute',
					value: {
						type: 'mdxJsxAttributeValueExpression',
						value: 'not-json',
					},
				},
			],
			name: 'ComponentPropsTable',
			type: 'mdxJsxFlowElement',
		} as { type: string }),
	).toThrow(/not valid GeneratedDoc JSON/);
});

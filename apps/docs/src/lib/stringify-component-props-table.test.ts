import type { GeneratedDoc } from 'fumadocs-typescript';
import { expect, test } from 'vite-plus/test';
import { NATIVE_PROPS_FORWARDING_KEY } from './component-prop-groups.js';
import {
	generatedDocToMarkdown,
	stringifyComponentPropsTable,
} from './stringify-component-props-table.js';

function entry(
	partial: Partial<GeneratedDoc['entries'][number]> & Pick<GeneratedDoc['entries'][number], 'name'>,
): GeneratedDoc['entries'][number] {
	return {
		deprecated: false,
		description: '',
		required: true,
		simplifiedType: 'string',
		tags: [],
		type: 'string',
		...partial,
	};
}

test('stringifies ComponentPropsTable from GeneratedDoc JSON into a Markdown props table', () => {
	const doc: GeneratedDoc = {
		description: 'Props for `Button`.',
		entries: [
			entry({
				description: 'Visual style of the control.',
				name: 'appearance',
				required: false,
				simplifiedType: 'union',
				type: '"button" | "text"',
			}),
			entry({
				description: 'Called when the button is pressed.',
				name: 'onPress',
				simplifiedType: 'function',
				type: '(e: PressEvent) => void',
			}),
			entry({
				description:
					'`ButtonProps` also accepts compatible DOM and ARIA attributes and event handlers for its rendered element.',
				name: NATIVE_PROPS_FORWARDING_KEY,
				simplifiedType: '',
				type: '',
			}),
		],
		id: 'button.tsx-ButtonProps',
		name: 'ButtonProps',
	};

	const markdown = stringifyComponentPropsTable({
		attributes: [
			{
				name: 'id',
				type: 'mdxJsxAttribute',
				value: 'type-table-button.tsx-ButtonProps',
			},
			{
				name: 'type',
				type: 'mdxJsxAttribute',
				value: {
					type: 'mdxJsxAttributeValueExpression',
					value: JSON.stringify(doc, null, 2),
				},
			},
		],
		name: 'ComponentPropsTable',
		type: 'mdxJsxFlowElement',
	} as { type: string });

	expect(markdown).toBe(generatedDocToMarkdown(doc));
	expect(markdown).toContain('### ButtonProps');
	expect(markdown).toContain('Props for `Button`.');
	expect(markdown).toContain(
		'`ButtonProps` also accepts compatible DOM and ARIA attributes and event handlers for its rendered element.',
	);
	expect(markdown).toContain('| Prop');
	expect(markdown).toContain('| Type');
	expect(markdown).toContain('| Description');
	expect(markdown).toContain('`appearance?`');
	expect(markdown).toContain('`union`');
	expect(markdown).toContain('`onPress`');
	expect(markdown).not.toContain(NATIVE_PROPS_FORWARDING_KEY);
	expect(markdown).not.toContain('<ComponentPropsTable');
});

test('emits the native-props note as prose and omits an empty props table', () => {
	const markdown = generatedDocToMarkdown({
		entries: [
			entry({
				description:
					'`KbdProps` also accepts compatible DOM and ARIA attributes and event handlers for its rendered element.',
				name: NATIVE_PROPS_FORWARDING_KEY,
				simplifiedType: '',
				type: '',
			}),
		],
		id: 'kbd.tsx-KbdProps',
		name: 'KbdProps',
	});

	expect(markdown).toBe(
		[
			'### KbdProps',
			'',
			'`KbdProps` also accepts compatible DOM and ARIA attributes and event handlers for its rendered element.',
		].join('\n'),
	);
	expect(markdown).not.toContain('| Prop');
	expect(markdown).not.toContain(NATIVE_PROPS_FORWARDING_KEY);
});

test('appends default values and marks deprecated props like Fumadocs', () => {
	const markdown = generatedDocToMarkdown({
		entries: [
			entry({
				deprecated: true,
				description: 'Legacy size token.',
				name: 'legacySize',
				required: false,
				simplifiedType: '"sm" | "md"',
				tags: [{ name: 'defaultValue', text: '"md"' }],
				type: '"sm" | "md"',
			}),
		],
		id: 'demo.tsx-DemoProps',
		name: 'DemoProps',
	});

	expect(markdown).toContain('`legacySize?`');
	expect(markdown).toContain('**Deprecated.** Legacy size token. Default: `"md"`');
});

test('leaves unrelated JSX nodes for the default stringifier', () => {
	expect(
		stringifyComponentPropsTable({
			attributes: [],
			name: 'TypeTable',
			type: 'mdxJsxFlowElement',
		} as { type: string }),
	).toBeUndefined();
	expect(
		stringifyComponentPropsTable({
			attributes: [],
			name: 'ExampleBlock',
			type: 'mdxJsxFlowElement',
		} as { type: string }),
	).toBeUndefined();
	expect(stringifyComponentPropsTable({ type: 'paragraph' })).toBeUndefined();
});

test('returns undefined when the type attribute is not GeneratedDoc JSON', () => {
	expect(
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
	).toBeUndefined();
});

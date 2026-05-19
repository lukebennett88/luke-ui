import { describe, expect, it } from 'vitest';
import type { ParsedComponent } from '../parse-types.js';
import { renderPage } from '../render-page.js';

const sampleParsed: ParsedComponent = {
	description: 'Sample composed button.',
	tier: 'composed',
	propsInterface: {
		name: 'SampleProps',
		extends: [{ from: 'external', module: 'react-aria-components', typeName: 'ButtonProps' }],
		members: [
			{
				name: 'size',
				type: "'small' | 'medium'",
				optional: true,
				default: "'medium'",
				description: 'Sets the size.',
			},
		],
	},
};

describe('renderPage component body', () => {
	it('emits H1 from the export slug, titlecased', () => {
		const page = renderPage({
			kind: 'component',
			slug: 'button',
			importPath: '@luke-ui/react/button',
			tier: 'composed',
			parsed: sampleParsed,
			proseMarkdown: '<authored usage>',
		});
		expect(page).toMatch(/^# Button\n/);
	});

	it('inserts the description as a blockquote', () => {
		const page = renderPage({
			kind: 'component',
			slug: 'button',
			importPath: '@luke-ui/react/button',
			tier: 'composed',
			parsed: sampleParsed,
			proseMarkdown: '<authored usage>',
		});
		expect(page).toContain('> Sample composed button.');
	});

	it('renders the import block', () => {
		const page = renderPage({
			kind: 'component',
			slug: 'button',
			importPath: '@luke-ui/react/button',
			tier: 'composed',
			parsed: sampleParsed,
			proseMarkdown: '',
		});
		expect(page).toContain("import { Button } from '@luke-ui/react/button';");
	});

	it('uses parsed.componentName for the import identifier when the export is renamed', () => {
		const page = renderPage({
			kind: 'component',
			slug: 'text-field-primitive',
			importPath: '@luke-ui/react/text-field/primitive',
			tier: 'primitive',
			parsed: { ...sampleParsed, componentName: 'TextInput' },
			proseMarkdown: undefined,
		});
		expect(page).toContain("import { TextInput } from '@luke-ui/react/text-field/primitive';");
	});

	it('renders the props table with own props only', () => {
		const page = renderPage({
			kind: 'component',
			slug: 'button',
			importPath: '@luke-ui/react/button',
			tier: 'composed',
			parsed: sampleParsed,
			proseMarkdown: '',
		});
		expect(page).toMatch(
			/\| `size` \| `'small' \\\| 'medium'` \| `'medium'` \| Sets the size\. \|/,
		);
	});

	it('emits an extends pointer for external types', () => {
		const page = renderPage({
			kind: 'component',
			slug: 'button',
			importPath: '@luke-ui/react/button',
			tier: 'composed',
			parsed: sampleParsed,
			proseMarkdown: '',
		});
		expect(page).toContain('Extends [`react-aria-components` `ButtonProps`]');
	});

	it('omits Usage section for primitives', () => {
		const page = renderPage({
			kind: 'component',
			slug: 'button-primitive',
			importPath: '@luke-ui/react/button/primitive',
			tier: 'primitive',
			parsed: sampleParsed,
			proseMarkdown: undefined,
		});
		expect(page).not.toContain('## Usage');
	});

	it('renders a (primitive) suffix on the title for primitive tier', () => {
		const page = renderPage({
			kind: 'component',
			slug: 'button-primitive',
			importPath: '@luke-ui/react/button/primitive',
			tier: 'primitive',
			parsed: sampleParsed,
			proseMarkdown: undefined,
		});
		expect(page).toMatch(/^# Button \(primitive\)\n/);
	});
});

describe('renderPage barrel body', () => {
	const sampleExports = [
		{
			name: 'WidgetControl',
			description: 'The main control.',
			type: 'function WidgetControl(props: WidgetControlProps): JSX.Element',
		},
		{ name: 'WidgetItem', description: 'A single item.', type: undefined },
	];

	it('emits an H1 with the slug title', () => {
		const page = renderPage({
			kind: 'barrel',
			slug: 'combobox-field-primitive',
			importPath: '@luke-ui/react/combobox-field/primitive',
			tier: 'primitive',
			exports: sampleExports,
		});
		expect(page).toMatch(/^# Combobox Field \(primitive\)\n/);
	});

	it('renders an Import block listing all exports', () => {
		const page = renderPage({
			kind: 'barrel',
			slug: 'combobox-field-primitive',
			importPath: '@luke-ui/react/combobox-field/primitive',
			tier: 'primitive',
			exports: sampleExports,
		});
		expect(page).toContain(
			"import { WidgetControl, WidgetItem } from '@luke-ui/react/combobox-field/primitive';",
		);
	});

	it('marks type-only exports in the import block', () => {
		const page = renderPage({
			kind: 'barrel',
			slug: 'heading-context',
			importPath: '@luke-ui/react/heading-context',
			tier: 'n/a',
			exports: [
				{ name: 'HeadingLevel', description: 'Allowed levels.', type: 'type HeadingLevel = 1' },
				{ name: 'HeadingLevels', description: 'Provider.', type: undefined },
			],
		});
		expect(page).toContain(
			"import { type HeadingLevel, HeadingLevels } from '@luke-ui/react/heading-context';",
		);
	});

	it('renders an ## Exports section with each export as an H3', () => {
		const page = renderPage({
			kind: 'barrel',
			slug: 'combobox-field-primitive',
			importPath: '@luke-ui/react/combobox-field/primitive',
			tier: 'primitive',
			exports: sampleExports,
		});
		expect(page).toContain('## Exports');
		expect(page).toContain('### `WidgetControl`');
		expect(page).toContain('### `WidgetItem`');
	});

	it('renders description as blockquote when provided', () => {
		const page = renderPage({
			kind: 'barrel',
			slug: 'field-primitive',
			importPath: '@luke-ui/react/field/primitive',
			tier: 'primitive',
			description: 'A barrel of field primitives.',
			exports: sampleExports,
		});
		expect(page).toContain('> A barrel of field primitives.');
	});

	it('renders type signature in a code fence when present', () => {
		const page = renderPage({
			kind: 'barrel',
			slug: 'combobox-field-primitive',
			importPath: '@luke-ui/react/combobox-field/primitive',
			tier: 'primitive',
			exports: sampleExports,
		});
		expect(page).toContain('function WidgetControl(props: WidgetControlProps): JSX.Element');
	});
});

import { describe, expect, it } from 'vitest';
import type { ParsedComponent } from '../parse-types.js';
import { renderPage } from '../render-page.js';

const sampleParsed: ParsedComponent = {
	description: 'Sample composed button.',
	propsInterface: {
		extends: [{ from: 'external', module: 'react-aria-components', typeName: 'ButtonProps' }],
		members: [
			{
				default: "'medium'",
				description: 'Sets the size.',
				name: 'size',
				optional: true,
				type: "'small' | 'medium'",
			},
		],
		name: 'SampleProps',
	},
	tier: 'composed',
};

describe('renderPage component body', () => {
	it('emits H1 from the export slug, titlecased', () => {
		const page = renderPage({
			importPath: '@luke-ui/react/button',
			kind: 'component',
			parsed: sampleParsed,
			proseMarkdown: '<authored usage>',
			slug: 'button',
			tier: 'composed',
		});
		expect(page).toMatch(/^# Button\n/);
	});

	it('inserts the description as a blockquote', () => {
		const page = renderPage({
			importPath: '@luke-ui/react/button',
			kind: 'component',
			parsed: sampleParsed,
			proseMarkdown: '<authored usage>',
			slug: 'button',
			tier: 'composed',
		});
		expect(page).toContain('> Sample composed button.');
	});

	it('renders the import block', () => {
		const page = renderPage({
			importPath: '@luke-ui/react/button',
			kind: 'component',
			parsed: sampleParsed,
			proseMarkdown: '',
			slug: 'button',
			tier: 'composed',
		});
		expect(page).toContain("import { Button } from '@luke-ui/react/button';");
	});

	it('uses parsed.componentName for the import identifier when the export is renamed', () => {
		const page = renderPage({
			importPath: '@luke-ui/react/text-field/primitive',
			kind: 'component',
			parsed: { ...sampleParsed, componentName: 'TextInput' },
			proseMarkdown: undefined,
			slug: 'text-field-primitive',
			tier: 'primitive',
		});
		expect(page).toContain("import { TextInput } from '@luke-ui/react/text-field/primitive';");
	});

	it('renders the props table with own props only', () => {
		const page = renderPage({
			importPath: '@luke-ui/react/button',
			kind: 'component',
			parsed: sampleParsed,
			proseMarkdown: '',
			slug: 'button',
			tier: 'composed',
		});
		expect(page).toMatch(
			/\| `size` \| `'small' \\\| 'medium'` \| `'medium'` \| Sets the size\. \|/,
		);
	});

	it('emits an extends pointer for external types', () => {
		const page = renderPage({
			importPath: '@luke-ui/react/button',
			kind: 'component',
			parsed: sampleParsed,
			proseMarkdown: '',
			slug: 'button',
			tier: 'composed',
		});
		expect(page).toContain('Extends [`react-aria-components` `ButtonProps`]');
	});

	it('omits Usage section for primitives', () => {
		const page = renderPage({
			importPath: '@luke-ui/react/button/primitive',
			kind: 'component',
			parsed: sampleParsed,
			proseMarkdown: undefined,
			slug: 'button-primitive',
			tier: 'primitive',
		});
		expect(page).not.toContain('## Usage');
	});

	it('renders a (primitive) suffix on the title for primitive tier', () => {
		const page = renderPage({
			importPath: '@luke-ui/react/button/primitive',
			kind: 'component',
			parsed: sampleParsed,
			proseMarkdown: undefined,
			slug: 'button-primitive',
			tier: 'primitive',
		});
		expect(page).toMatch(/^# Button \(primitive\)\n/);
	});
});

describe('renderPage barrel body', () => {
	const sampleExports = [
		{
			description: 'The main control.',
			name: 'WidgetControl',
			type: 'function WidgetControl(props: WidgetControlProps): JSX.Element',
		},
		{ description: 'A single item.', name: 'WidgetItem', type: undefined },
	];

	it('emits an H1 with the slug title', () => {
		const page = renderPage({
			exports: sampleExports,
			importPath: '@luke-ui/react/combobox-field/primitive',
			kind: 'barrel',
			slug: 'combobox-field-primitive',
			tier: 'primitive',
		});
		expect(page).toMatch(/^# Combobox Field \(primitive\)\n/);
	});

	it('renders an Import block listing all exports', () => {
		const page = renderPage({
			exports: sampleExports,
			importPath: '@luke-ui/react/combobox-field/primitive',
			kind: 'barrel',
			slug: 'combobox-field-primitive',
			tier: 'primitive',
		});
		expect(page).toContain(
			"import { WidgetControl, WidgetItem } from '@luke-ui/react/combobox-field/primitive';",
		);
	});

	it('marks type-only exports in the import block', () => {
		const page = renderPage({
			exports: [
				{ description: 'Allowed levels.', name: 'HeadingLevel', type: 'type HeadingLevel = 1' },
				{ description: 'Provider.', name: 'HeadingLevels', type: undefined },
			],
			importPath: '@luke-ui/react/heading-context',
			kind: 'barrel',
			slug: 'heading-context',
			tier: 'n/a',
		});
		expect(page).toContain(
			"import { type HeadingLevel, HeadingLevels } from '@luke-ui/react/heading-context';",
		);
	});

	it('renders an ## Exports section with each export as an H3', () => {
		const page = renderPage({
			exports: sampleExports,
			importPath: '@luke-ui/react/combobox-field/primitive',
			kind: 'barrel',
			slug: 'combobox-field-primitive',
			tier: 'primitive',
		});
		expect(page).toContain('## Exports');
		expect(page).toContain('### `WidgetControl`');
		expect(page).toContain('### `WidgetItem`');
	});

	it('renders description as blockquote when provided', () => {
		const page = renderPage({
			description: 'A barrel of field primitives.',
			exports: sampleExports,
			importPath: '@luke-ui/react/field/primitive',
			kind: 'barrel',
			slug: 'field-primitive',
			tier: 'primitive',
		});
		expect(page).toContain('> A barrel of field primitives.');
	});

	it('renders type signature in a code fence when present', () => {
		const page = renderPage({
			exports: sampleExports,
			importPath: '@luke-ui/react/combobox-field/primitive',
			kind: 'barrel',
			slug: 'combobox-field-primitive',
			tier: 'primitive',
		});
		expect(page).toContain('function WidgetControl(props: WidgetControlProps): JSX.Element');
	});
});

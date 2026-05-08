import { describe, expect, it } from 'vitest';
import type { ParsedComponent } from '../parse-types.js';
import { renderBarrelPage, renderComponentPage } from '../render-page.js';

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

describe('renderComponentPage', () => {
	it('emits H1 from the export slug, titlecased', () => {
		const page = renderComponentPage({
			slug: 'button',
			importPath: '@luke-ui/react/button',
			tier: 'composed',
			parsed: sampleParsed,
			proseMarkdown: '<authored usage>',
		});
		expect(page).toMatch(/^# Button\n/);
	});

	it('inserts the description as a blockquote', () => {
		const page = renderComponentPage({
			slug: 'button',
			importPath: '@luke-ui/react/button',
			tier: 'composed',
			parsed: sampleParsed,
			proseMarkdown: '<authored usage>',
		});
		expect(page).toContain('> Sample composed button.');
	});

	it('renders the import block', () => {
		const page = renderComponentPage({
			slug: 'button',
			importPath: '@luke-ui/react/button',
			tier: 'composed',
			parsed: sampleParsed,
			proseMarkdown: '',
		});
		expect(page).toContain("import { Button } from '@luke-ui/react/button';");
	});

	it('renders the props table with own props only', () => {
		const page = renderComponentPage({
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
		const page = renderComponentPage({
			slug: 'button',
			importPath: '@luke-ui/react/button',
			tier: 'composed',
			parsed: sampleParsed,
			proseMarkdown: '',
		});
		expect(page).toContain('Extends [`react-aria-components` `ButtonProps`]');
	});

	it('omits Usage section for primitives', () => {
		const page = renderComponentPage({
			slug: 'button-primitive',
			importPath: '@luke-ui/react/button/primitive',
			tier: 'primitive',
			parsed: sampleParsed,
			proseMarkdown: undefined,
		});
		expect(page).not.toContain('## Usage');
	});

	it('renders a (primitive) suffix on the title for primitive tier', () => {
		const page = renderComponentPage({
			slug: 'button-primitive',
			importPath: '@luke-ui/react/button/primitive',
			tier: 'primitive',
			parsed: sampleParsed,
			proseMarkdown: undefined,
		});
		expect(page).toMatch(/^# Button \(primitive\)\n/);
	});
});

describe('renderBarrelPage', () => {
	const sampleExports = [
		{
			name: 'WidgetControl',
			description: 'The main control.',
			type: 'function WidgetControl(props: WidgetControlProps): JSX.Element',
		},
		{ name: 'WidgetItem', description: 'A single item.', type: undefined },
	];

	it('emits an H1 with the slug title', () => {
		const page = renderBarrelPage({
			slug: 'combobox-field-primitive',
			importPath: '@luke-ui/react/combobox-field/primitive',
			tier: 'primitive',
			exports: sampleExports,
		});
		expect(page).toMatch(/^# Combobox Field \(primitive\)\n/);
	});

	it('renders an Import block listing all exports', () => {
		const page = renderBarrelPage({
			slug: 'combobox-field-primitive',
			importPath: '@luke-ui/react/combobox-field/primitive',
			tier: 'primitive',
			exports: sampleExports,
		});
		expect(page).toContain(
			"import { WidgetControl, WidgetItem } from '@luke-ui/react/combobox-field/primitive';",
		);
	});

	it('renders an ## Exports section with each export as an H3', () => {
		const page = renderBarrelPage({
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
		const page = renderBarrelPage({
			slug: 'field-primitive',
			importPath: '@luke-ui/react/field/primitive',
			tier: 'primitive',
			description: 'A barrel of field primitives.',
			exports: sampleExports,
		});
		expect(page).toContain('> A barrel of field primitives.');
	});

	it('renders type signature in a code fence when present', () => {
		const page = renderBarrelPage({
			slug: 'combobox-field-primitive',
			importPath: '@luke-ui/react/combobox-field/primitive',
			tier: 'primitive',
			exports: sampleExports,
		});
		expect(page).toContain('function WidgetControl(props: WidgetControlProps): JSX.Element');
	});
});

import { describe, expect, it } from 'vite-plus/test';
import type { PackageDocsBarrelEntry, PackageDocsComponentEntry } from '../package-docs-catalog.js';
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

function componentEntry(
	overrides: Partial<PackageDocsComponentEntry> = {},
): PackageDocsComponentEntry {
	return {
		description: 'Sample composed button.',
		pageKind: 'component',
		parsed: sampleParsed,
		path: './button',
		shape: 'component',
		slug: 'button',
		sourcePath: '/src/button/index.tsx',
		target: './dist/button/index.js',
		tier: 'composed',
		title: 'Button',
		...overrides,
	};
}

function renderComponent(
	entryOverrides: Partial<PackageDocsComponentEntry> = {},
	proseMarkdown = '',
): string {
	return renderPage({
		entry: componentEntry(entryOverrides),
		importPath: '@luke-ui/react/button',
		proseMarkdown,
	});
}

const sampleExports = [
	{
		description: 'The main control.',
		name: 'WidgetControl',
		type: 'function WidgetControl(props: WidgetControlProps): JSX.Element',
	},
	{ description: 'A single item.', name: 'WidgetItem', type: undefined },
];

function barrelEntry(overrides: Partial<PackageDocsBarrelEntry> = {}): PackageDocsBarrelEntry {
	return {
		description: '',
		pageKind: 'barrel',
		parsed: { description: '', exports: sampleExports },
		path: './combobox-field/primitive',
		shape: 'component',
		slug: 'combobox-field-primitive',
		sourcePath: '/src/combobox-field/primitive/index.tsx',
		target: './dist/combobox-field/primitive/index.js',
		tier: 'primitive',
		title: 'Combobox Field (primitive)',
		...overrides,
	};
}

function renderBarrel(entryOverrides: Partial<PackageDocsBarrelEntry> = {}): string {
	return renderPage({
		entry: barrelEntry(entryOverrides),
		importPath: '@luke-ui/react/combobox-field/primitive',
		proseMarkdown: undefined,
	});
}

describe('renderPage component body', () => {
	it('uses resolved catalog metadata for the header', () => {
		const page = renderComponent({
			description: 'Resolved description.',
			title: 'Resolved Button',
		});
		expect(page).toMatch(/^# Resolved Button\n/);
		expect(page).toContain('> Resolved description.');
	});

	it('renders the import block', () => {
		expect(renderComponent()).toContain("import { Button } from '@luke-ui/react/button';");
	});

	it('uses parsed.componentName for the import identifier when the export is renamed', () => {
		const page = renderPage({
			entry: componentEntry({
				parsed: { ...sampleParsed, componentName: 'TextInput' },
				path: './text-field/primitive',
				slug: 'text-field-primitive',
				tier: 'primitive',
				title: 'Text Field (primitive)',
			}),
			importPath: '@luke-ui/react/text-field/primitive',
			proseMarkdown: undefined,
		});
		expect(page).toContain("import { TextInput } from '@luke-ui/react/text-field/primitive';");
	});

	it('renders the props table with own props only', () => {
		expect(renderComponent()).toMatch(
			/\| `size` \| `'small' \\\| 'medium'` \| `'medium'` \| Sets the size\. \|/,
		);
	});

	it('emits an extends pointer for external types', () => {
		expect(renderComponent()).toContain('Extends [`react-aria-components` `ButtonProps`]');
	});

	it('omits Usage section for primitives', () => {
		expect(
			renderComponent({ tier: 'primitive', title: 'Button (primitive)' }, '<authored usage>'),
		).not.toContain('## Usage');
	});
});

describe('renderPage barrel body', () => {
	it('uses the resolved title', () => {
		expect(renderBarrel()).toMatch(/^# Combobox Field \(primitive\)\n/);
	});

	it('renders an Import block listing all exports', () => {
		expect(renderBarrel()).toContain(
			"import { WidgetControl, WidgetItem } from '@luke-ui/react/combobox-field/primitive';",
		);
	});

	it('marks type-only exports in the import block', () => {
		const page = renderBarrel({
			parsed: {
				description: '',
				exports: [
					{
						description: 'Allowed levels.',
						name: 'HeadingLevel',
						type: 'type HeadingLevel = 1',
					},
					{ description: 'Provider.', name: 'HeadingLevels', type: undefined },
				],
			},
		});
		expect(page).toContain('import { type HeadingLevel, HeadingLevels }');
	});

	it('renders each export with descriptions and type signatures', () => {
		const page = renderBarrel();
		expect(page).toContain('## Exports');
		expect(page).toContain('### `WidgetControl`');
		expect(page).toContain('### `WidgetItem`');
		expect(page).toContain('The main control.');
		expect(page).toContain('function WidgetControl(props: WidgetControlProps): JSX.Element');
	});

	it('renders the resolved description as a blockquote', () => {
		expect(renderBarrel({ description: 'A barrel of field primitives.' })).toContain(
			'> A barrel of field primitives.',
		);
	});
});

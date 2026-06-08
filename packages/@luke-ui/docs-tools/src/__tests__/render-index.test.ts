import { describe, expect, it } from 'vitest';
import type { PackageDocsCatalogMetadata } from '../package-docs-catalog.js';
import { renderIndex } from '../render-index.js';

const sampleEntries: Array<PackageDocsCatalogMetadata> = [
	{
		description: 'Composed button.',
		pageKind: 'component',
		path: './button',
		shape: 'component',
		slug: 'button',
		target: '',
		tier: 'composed',
		title: 'Button',
	},
	{
		description: 'Bare button.',
		pageKind: 'component',
		path: './button/primitive',
		shape: 'component',
		slug: 'button-primitive',
		target: '',
		tier: 'primitive',
		title: 'Button (primitive)',
	},
	{
		description: 'Design tokens.',
		pageKind: 'barrel',
		path: './tokens',
		shape: 'barrel',
		slug: 'tokens',
		target: '',
		tier: 'n/a',
		title: 'Tokens',
	},
	{
		description: '',
		pageKind: 'asset',
		path: './stylesheet.css',
		shape: 'asset',
		slug: 'stylesheet',
		target: '',
		tier: 'n/a',
		title: 'Stylesheet',
	},
];

describe('renderIndex', () => {
	it('uses resolved catalog titles directly', () => {
		const out = renderIndex({
			entries: sampleEntries.map((entry) =>
				entry.slug === 'button' ? { ...entry, title: 'Resolved Button' } : entry,
			),
			includeLibraryAuthors: false,
			packageName: '@luke-ui/react',
		});
		expect(out).toMatch(/- \[Resolved Button\]\(\.\/button\.md\)/);
	});

	it('lists composed components in the primary section', () => {
		const out = renderIndex({
			entries: sampleEntries,
			includeLibraryAuthors: false,
			packageName: '@luke-ui/react',
		});
		expect(out).toMatch(/- \[Button\]\(\.\/button\.md\)/);
	});

	it('omits primitives when includeLibraryAuthors is false', () => {
		const out = renderIndex({
			entries: sampleEntries,
			includeLibraryAuthors: false,
			packageName: '@luke-ui/react',
		});
		expect(out).not.toMatch(/Button \(primitive\)/);
		expect(out).not.toMatch(/## Library authors/);
	});

	it('includes primitives in a Library authors section when flag is true', () => {
		const out = renderIndex({
			entries: sampleEntries,
			includeLibraryAuthors: true,
			packageName: '@luke-ui/react',
		});
		expect(out).toMatch(/## Library authors/);
		expect(out).toMatch(/- \[Button \(primitive\)\]\(\.\/button-primitive\.md\)/);
	});

	it('lists assets inline (no link) under Assets section', () => {
		const out = renderIndex({
			entries: sampleEntries,
			includeLibraryAuthors: true,
			packageName: '@luke-ui/react',
		});
		expect(out).toMatch(/## Assets/);
		expect(out).toMatch(/stylesheet\.css.*import '@luke-ui\/react\/stylesheet\.css'/);
	});

	it('uses entry href when provided', () => {
		const out = renderIndex({
			entries: sampleEntries.map((entry) =>
				entry.slug === 'button'
					? { ...entry, href: './llms.mdx/docs/components/actions/button.md' }
					: entry,
			),
			includeLibraryAuthors: false,
			packageName: '@luke-ui/react',
		});
		expect(out).toMatch(/\[Button\]\(\.\/llms\.mdx\/docs\/components\/actions\/button\.md\)/);
		expect(out).toMatch(/\[Tokens\]\(\.\/tokens\.md\)/);
	});
});

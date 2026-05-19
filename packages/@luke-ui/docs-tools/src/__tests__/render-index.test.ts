import { describe, expect, it } from 'vitest';
import type { DiscoveredExport } from '../discover-exports.js';
import { renderIndex } from '../render-index.js';

const sampleEntries: Array<DiscoveredExport & { description?: string }> = [
	{
		path: './button',
		target: '',
		slug: 'button',
		shape: 'component',
		pageKind: 'component',
		tier: 'composed',
		description: 'Composed button.',
	},
	{
		path: './button/primitive',
		target: '',
		slug: 'button-primitive',
		shape: 'component',
		pageKind: 'component',
		tier: 'primitive',
		description: 'Bare button.',
	},
	{
		path: './tokens',
		target: '',
		slug: 'tokens',
		shape: 'barrel',
		pageKind: 'barrel',
		tier: 'n/a',
		description: 'Design tokens.',
	},
	{
		path: './stylesheet.css',
		target: '',
		slug: 'stylesheet',
		shape: 'asset',
		pageKind: 'asset',
		tier: 'n/a',
	},
];

describe('renderIndex', () => {
	it('lists composed components in the primary section', () => {
		const out = renderIndex({
			packageName: '@luke-ui/react',
			entries: sampleEntries,
			includeLibraryAuthors: false,
		});
		expect(out).toMatch(/- \[Button\]\(\.\/button\.md\)/);
	});

	it('omits primitives when includeLibraryAuthors is false', () => {
		const out = renderIndex({
			packageName: '@luke-ui/react',
			entries: sampleEntries,
			includeLibraryAuthors: false,
		});
		expect(out).not.toMatch(/Button \(primitive\)/);
		expect(out).not.toMatch(/## Library authors/);
	});

	it('includes primitives in a Library authors section when flag is true', () => {
		const out = renderIndex({
			packageName: '@luke-ui/react',
			entries: sampleEntries,
			includeLibraryAuthors: true,
		});
		expect(out).toMatch(/## Library authors/);
		expect(out).toMatch(/- \[Button \(primitive\)\]\(\.\/button-primitive\.md\)/);
	});

	it('lists assets inline (no link) under Assets section', () => {
		const out = renderIndex({
			packageName: '@luke-ui/react',
			entries: sampleEntries,
			includeLibraryAuthors: true,
		});
		expect(out).toMatch(/## Assets/);
		expect(out).toMatch(/stylesheet\.css.*import '@luke-ui\/react\/stylesheet\.css'/);
	});

	it('uses entry href when provided', () => {
		const out = renderIndex({
			packageName: '@luke-ui/react',
			entries: sampleEntries.map((entry) =>
				entry.slug === 'button'
					? Object.assign(entry, { href: './llms.mdx/docs/components/actions/button.md' })
					: entry,
			),
			includeLibraryAuthors: false,
		});
		expect(out).toMatch(/\[Button\]\(\.\/llms\.mdx\/docs\/components\/actions\/button\.md\)/);
		expect(out).toMatch(/\[Tokens\]\(\.\/tokens\.md\)/);
	});
});

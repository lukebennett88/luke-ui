import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, expect, test } from 'vite-plus/test';
import {
	findRedirectIssues,
	getDocsPagePaths,
	parseNetlifyRedirects,
} from './redirect-coverage.js';

const testDirectories: Array<string> = [];

afterEach(() => {
	for (const directory of testDirectories) {
		rmSync(directory, { force: true, recursive: true });
	}

	testDirectories.length = 0;
});

test('parses from and to out of each redirects block', () => {
	const toml = `
[build]
command = "pnpm run build"

[[redirects]]
from = "/overview/getting-started"
to = "/installation"
status = 301

[[redirects]]
from = "/guides/quality"
to = "/quality"
status = 301
`;

	expect(parseNetlifyRedirects(toml)).toEqual([
		{ from: '/overview/getting-started', to: '/installation' },
		{ from: '/guides/quality', to: '/quality' },
	]);
});

test('resolves an index.mdx to its folder path, and the root index.mdx to /', () => {
	const docsDir = createDocsFixture({
		'index.mdx': 'root',
		'installation.mdx': 'a page',
		'components/actions/button/index.mdx': 'a guide',
		'components/actions/button/props.mdx': 'its props',
	});

	expect(getDocsPagePaths(docsDir)).toEqual(
		new Set([
			'/',
			'/installation',
			'/components/actions/button',
			'/components/actions/button/props',
		]),
	);
});

test('reports a removed path with no redirect rule', () => {
	const issues = findRedirectIssues({
		existingPagePaths: new Set(['/installation']),
		redirects: [],
		removedPaths: ['/overview/getting-started'],
	});

	expect(issues).toEqual(['/overview/getting-started: no redirect rule found']);
});

test('reports a redirect whose destination page no longer exists', () => {
	const issues = findRedirectIssues({
		existingPagePaths: new Set(['/installation']),
		redirects: [{ from: '/overview/getting-started', to: '/setup' }],
		removedPaths: ['/overview/getting-started'],
	});

	expect(issues).toEqual([
		'/overview/getting-started: redirect destination "/setup" does not resolve to a page',
	]);
});

test('finds no issues when every removed path redirects to a page that exists', () => {
	const issues = findRedirectIssues({
		existingPagePaths: new Set(['/installation']),
		redirects: [{ from: '/overview/getting-started', to: '/installation' }],
		removedPaths: ['/overview/getting-started'],
	});

	expect(issues).toEqual([]);
});

// This task (#333) flattened every non-component docs page to the top level of
// `content/docs`. These are the old paths that no longer resolve to a page — each one must have
// a `netlify.toml` redirect whose destination still exists, or the old URL 404s. When a later
// ticket removes or renames another page, add its old path here alongside the new redirect rule.
const REMOVED_DOCS_PATHS = [
	'/overview/getting-started',
	'/overview/principles',
	'/overview/composition',
	'/overview/styling',
	'/overview/layout',
	'/overview/breakpoints',
	'/overview/typography',
	'/overview/iconography',
	'/overview/color',
	'/overview/color-mode',
	'/overview/theme',
	'/overview/spacing',
	'/overview/radius',
	'/overview/shadow',
	'/theming/system',
	'/theming/applying',
	'/theming/authoring',
	'/theming/token-reference',
	'/guides/forms',
	'/guides/quality',
	'/principles',
	'/breakpoints',
];

test('every removed docs path redirects to a page that exists', () => {
	const netlifyToml = readFileSync(
		resolve(import.meta.dirname, '../../../../netlify.toml'),
		'utf8',
	);
	const redirects = parseNetlifyRedirects(netlifyToml);
	const existingPagePaths = getDocsPagePaths(resolve(import.meta.dirname, '../../content/docs'));

	expect(
		findRedirectIssues({ existingPagePaths, redirects, removedPaths: REMOVED_DOCS_PATHS }),
	).toEqual([]);
});

function createDocsFixture(files: Record<string, string>): string {
	const docsDir = mkdtempSync(join(tmpdir(), 'luke-ui-redirect-coverage-'));
	testDirectories.push(docsDir);

	for (const [path, content] of Object.entries(files)) {
		const filePath = join(docsDir, path);
		mkdirSync(dirname(filePath), { recursive: true });
		writeFileSync(filePath, content);
	}

	return docsDir;
}

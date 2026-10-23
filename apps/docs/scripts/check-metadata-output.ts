import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { license } from '../../../packages/@luke-ui/react/package.json' with { type: 'json' };
import { notFoundMarkdown } from '../src/lib/agent-negotiation.js';
import { GITHUB_REPO_URL } from '../src/lib/github.js';
import { HOME_INTRO } from '../src/lib/home-content.js';
import { resolveSiteUrl } from '../src/lib/resolve-site-url.js';

const output = fileURLToPath(new URL('../dist/client/', import.meta.url));
const base = process.env.VITE_BASE_URL || '/';
const origin = process.env.SITE_URL || 'https://ui.lukebennett.dev';
const root = `${resolveSiteUrl(origin, base)}/`;
const TAG_PATTERN = /<(?:meta|link)\b[^>]*>/g;
const ATTRIBUTE_PATTERN = /([\w:-]+)="([^"]*)"/g;
const JSON_LD_PATTERN = /<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs;

const pages = [
	{ path: '', title: 'Luke UI', description: HOME_INTRO, markdown: 'index.md' },
	{
		path: 'docs/installation/',
		title: 'Installation | Luke UI',
		description: 'Install Luke UI and a theme, and render a component.',
		markdown: 'docs/installation.md',
	},
	{
		path: 'components/actions/button/',
		title: 'Button | Luke UI',
		description: 'A labelled control for actions in an interface.',
		markdown: 'components/actions/button.md',
	},
	{
		path: 'playground/',
		title: 'Playground | Luke UI',
		description: 'Edit and preview Luke UI components in the browser.',
	},
];

for (const page of pages) {
	const html = read(`${page.path}index.html`);
	const tags = readTags(html);
	const url = `${root}${page.path}`;
	assert.ok(html.includes(`<title>${page.title}</title>`), page.path);
	assert.deepEqual(
		tags.filter((tag) => tag.rel === 'canonical'),
		[{ href: url, rel: 'canonical' }],
	);
	assert.equal(tags.find((tag) => tag.name === 'description')?.content, page.description);
	for (const [property, content] of Object.entries({
		'og:type': 'website',
		'og:title': page.title,
		'og:description': page.description,
		'og:url': url,
	})) {
		assert.deepEqual(
			tags.filter((tag) => tag.property === property),
			[{ content, property }],
		);
	}
	assert.ok(read('sitemap.xml').includes(`<loc>${url}</loc>`));
	if (page.markdown) {
		assert.deepEqual(
			tags.filter((tag) => tag.rel === 'alternate'),
			[{ href: `${base}${page.markdown}`, rel: 'alternate', type: 'text/markdown' }],
		);
		assert.ok(read(page.markdown).length > 0);
	} else {
		assert.equal(
			tags.filter((tag) => tag.rel === 'alternate').length,
			0,
			`${page.path} should not advertise a Markdown twin`,
		);
	}
	if (page.path && page.markdown) {
		assert.ok(read('llms.txt').includes(`${root}${page.markdown}`));
		assert.equal([...html.matchAll(JSON_LD_PATTERN)].length, 0);
	}
}

const structuredData = [...read('index.html').matchAll(JSON_LD_PATTERN)];
assert.equal(structuredData.length, 1);
assert.deepEqual(JSON.parse(structuredData[0]![1]!), {
	'@context': 'https://schema.org',
	'@type': 'SoftwareSourceCode',
	name: 'Luke UI',
	description: HOME_INTRO,
	url: root,
	codeRepository: GITHUB_REPO_URL,
	license: `https://spdx.org/licenses/${license}.html`,
	programmingLanguage: 'TypeScript',
});
assert.ok(read('robots.txt').includes(`Sitemap: ${root}sitemap.xml`));
assert.ok(read('llms.txt').includes(`${root}llms-full.txt`));
assert.equal(
	readTags(read('404.html')).some((tag) => tag.rel === 'canonical'),
	false,
);
assert.equal([...read('404.html').matchAll(JSON_LD_PATTERN)].length, 0);

const markdown404 = notFoundMarkdown('/missing', resolveSiteUrl(origin, base));
assert.ok(markdown404.includes(`[llms.txt](${root}llms.txt)`));
assert.ok(markdown404.includes(`[Sitemap](${root}sitemap.xml)`));
assert.ok(markdown404.includes(`[Luke UI home](${root})`));

for (const file of readdirSync(resolve(output, 'assets'), { encoding: 'utf8', recursive: true })) {
	if (!file.endsWith('.js')) continue;
	const js = read(`assets/${file}`);
	assert.ok(!js.includes('SoftwareSourceCode'), `JSON-LD reached client asset ${file}`);
	assert.ok(!js.includes('schema-dts'), `schema-dts reached client asset ${file}`);
}

console.log(`check:metadata: generated HTML, discovery URLs and client assets passed for ${root}`);

function read(path: string): string {
	return readFileSync(resolve(output, path), 'utf8');
}

function readTags(html: string): Array<Record<string, string>> {
	return [...html.matchAll(TAG_PATTERN)].map(([tag]) =>
		Object.fromEntries([...tag.matchAll(ATTRIBUTE_PATTERN)].map((match) => [match[1], match[2]])),
	);
}

import { createFileRoute } from '@tanstack/react-router';
import componentsMeta from '../../content/docs/components/meta.json' with { type: 'json' };
import docsMeta from '../../content/docs/docs/meta.json' with { type: 'json' };
import { HOME_INTRO } from '../lib/home-content.js';
import type { LlmsIndexPage, LlmsIndexSection } from '../lib/llms-index.js';
import { buildLlmsIndex, parseMetaGroups } from '../lib/llms-index.js';
import { markdownUrlForPage } from '../lib/markdown-page-path.js';
import { siteUrl } from '../lib/site-url.js';
import { source } from '../lib/source';

export const Route = createFileRoute('/llms.txt')({
	server: {
		handlers: {
			GET: async () => {
				const origin = siteUrl();
				const sections = buildSections(origin);
				const body = buildLlmsIndex({ intro: HOME_INTRO, origin, sections });
				return new Response(body, {
					headers: { 'Content-Type': 'text/plain; charset=utf-8' },
				});
			},
		},
	},
});

/**
 * One `LlmsIndexSection` per docs and component group, in `meta.json` order.
 * The `/components` catalogue index sits between the docs groups and the
 * component groups. Each group's member slugs come from parsing that group's
 * statically imported `meta.json`; each page's title, description, and Markdown
 * URL come from `source.getPages()`. The `meta.json` files are imported rather
 * than read from disk at request time, since a prerendered build's working
 * directory does not contain `content/docs`.
 */
function buildSections(origin: string): Array<LlmsIndexSection> {
	const pageBySlug = new Map(
		source.getPages().map((page) => [page.path.replace(/\.mdx$/, ''), page] as const),
	);

	const docsGroups = parseMetaGroups(readMetaPages(docsMeta)).map((group) => ({
		...group,
		slugs: group.slugs.map((slug) => `docs/${slug}`),
	}));
	const componentGroups = parseMetaGroups(readMetaPages(componentsMeta)).map((group) => ({
		...group,
		slugs: group.slugs.map((slug) => `components/${slug}`),
		title: `Components: ${group.title}`,
	}));

	const toSections = (groups: typeof docsGroups): Array<LlmsIndexSection> =>
		groups.map((group): LlmsIndexSection => ({
			pages: group.slugs.flatMap((slug) => {
				const page = pageBySlug.get(slug);
				return page ? [toIndexPage(page, origin)] : [];
			}),
			title: group.title,
		}));

	const docsSections = toSections(docsGroups);

	const componentsIndexPage = pageBySlug.get('components/index');
	const componentsIndexSection: LlmsIndexSection = {
		pages: componentsIndexPage ? [toIndexPage(componentsIndexPage, origin)] : [],
		title: 'Components',
	};

	const componentSections = toSections(componentGroups);

	return [...docsSections, componentsIndexSection, ...componentSections];
}

function toIndexPage(
	page: { data: { description?: string; title: string }; url: string },
	origin: string,
): LlmsIndexPage {
	return {
		description: page.data.description ?? '',
		markdownUrl: `${origin}${markdownUrlForPage(page.url)}`,
		title: page.data.title,
	};
}

function readMetaPages(meta: unknown): Array<string> {
	if (typeof meta !== 'object' || meta === null) return [];
	const pages = (meta as { pages?: unknown }).pages;
	if (!Array.isArray(pages)) return [];
	return pages.filter((page): page is string => typeof page === 'string');
}

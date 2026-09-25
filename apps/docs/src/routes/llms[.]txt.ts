import { createFileRoute } from '@tanstack/react-router';
import docsMeta from '../../content/docs/docs/meta.json' with { type: 'json' };
import { componentIndexGroups } from '../generated/components-index.generated.js';
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
 * One `LlmsIndexSection` per docs group (in `docs/meta.json` order), then the
 * `/components` catalogue page, then one section per `componentIndexGroups`
 * entry — the same generated, sidebar-ordered groups the components landing
 * page renders from, so the two never drift apart. Docs group membership
 * still comes from parsing the statically imported `meta.json`, since docs
 * pages have no generated index of their own; each page's title, description,
 * and Markdown URL come from `source.getPages()`.
 */
function buildSections(origin: string): Array<LlmsIndexSection> {
	const pageBySlug = new Map(
		source.getPages().map((page) => [page.path.replace(/\.mdx$/, ''), page] as const),
	);

	const docsGroups = parseMetaGroups(readMetaPages(docsMeta)).map((group) => ({
		...group,
		slugs: group.slugs.map((slug) => `docs/${slug}`),
	}));

	const docsSections = docsGroups.map((group): LlmsIndexSection => ({
		pages: group.slugs.flatMap((slug) => {
			const page = pageBySlug.get(slug);
			return page ? [toIndexPage(page, origin)] : [];
		}),
		title: group.title,
	}));

	const componentsIndexPage = pageBySlug.get('components/index');
	const componentsIndexSection: LlmsIndexSection = {
		pages: componentsIndexPage ? [toIndexPage(componentsIndexPage, origin)] : [],
		title: 'Components',
	};

	const componentSections = componentIndexGroups.map((group): LlmsIndexSection => ({
		pages: group.entries.map((entry) => ({
			description: entry.description,
			markdownUrl: `${origin}${markdownUrlForPage(entry.url)}`,
			title: entry.name,
		})),
		title: `Components: ${group.title}`,
	}));

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

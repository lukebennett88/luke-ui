import { withBasePath } from './markdown-url';

const STORYBOOK_DEV_URL = 'http://localhost:6006';

const COMPONENT_DOC_PATH = /^components\/([^/]+)\/([^/]+)\.mdx$/;

export function getStorybookBaseUrl(basePath: string): string {
	if (import.meta.env.DEV) return STORYBOOK_DEV_URL;
	return withBasePath('/storybook', basePath).replace(/\/$/, '');
}

export function getStorybookStoryUrl(pagePath: string, basePath: string): string | null {
	const match = COMPONENT_DOC_PATH.exec(pagePath);
	if (!match?.[1] || !match[2]) return null;
	const [, category, name] = match;
	const storyId = `${category}-${name.replace(/-/g, '')}--docs`;
	return `${getStorybookBaseUrl(basePath)}/?path=/docs/${storyId}`;
}

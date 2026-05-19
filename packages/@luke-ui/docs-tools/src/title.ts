import type { ExportTier } from './discover-exports.js';

export function slugToTitle(slug: string, tier: ExportTier): string {
	const isPrimitive = slug.endsWith('-primitive');
	const base = (isPrimitive ? slug.slice(0, -'-primitive'.length) : slug)
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
	if (tier === 'primitive') return `${base} (primitive)`;
	return base;
}

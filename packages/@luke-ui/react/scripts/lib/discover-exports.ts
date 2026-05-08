export type ExportShape = 'component' | 'barrel' | 'asset';
export type ExportTier = 'atom' | 'composed' | 'primitive' | 'n/a';

export interface DiscoveredExport {
	/** The export specifier from package.json#exports, e.g. './button'. */
	path: string;
	/** The dist target path (right-hand side of #exports). */
	target: string;
	/** The slug used for the generated .md filename, e.g. 'button' or 'button-primitive'. */
	slug: string;
	shape: ExportShape;
	tier: ExportTier;
	/** Absolute path to the source `index.tsx` for components/barrels; undefined for assets. */
	sourcePath?: string;
}

const BARREL_PATHS = new Set(['./recipes', './theme', './tokens', './utils']);
const ASSET_PATHS = new Set(['./stylesheet.css', './spritesheet.svg', './package.json']);

export function discoverExports(exportsField: Record<string, string>): Array<DiscoveredExport> {
	const result: Array<DiscoveredExport> = [];
	for (const [path, target] of Object.entries(exportsField)) {
		let shape: ExportShape;
		let tier: ExportTier;
		if (ASSET_PATHS.has(path)) {
			shape = 'asset';
			tier = 'n/a';
		} else if (BARREL_PATHS.has(path)) {
			shape = 'barrel';
			tier = 'n/a';
		} else {
			shape = 'component';
			tier = path.endsWith('/primitive') ? 'primitive' : 'composed';
		}
		const slug = path
			.replace(/^\.\//, '')
			.replace(/\//g, '-')
			.replace(/\.[^.]+$/, '');
		result.push({ path, target, slug, shape, tier });
	}
	return result;
}

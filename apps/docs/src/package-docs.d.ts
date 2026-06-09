declare module 'virtual:package-docs' {
	import type { PackageDocsCatalogMetadata } from '@luke-ui/docs-tools/package-docs-catalog';

	export const packageDocsCatalog: Array<PackageDocsCatalogMetadata>;
	export const packageDocs: Record<string, string>;
}

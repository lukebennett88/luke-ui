declare module 'virtual:package-docs' {
	export const packageDocsCatalog: Array<
		import('@luke-ui/docs-tools/package-docs-catalog').PackageDocsCatalogMetadata
	>;
	export const packageDocs: Record<string, string>;
}

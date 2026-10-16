import type { GeneratedDoc } from 'fumadocs-typescript';

/**
 * Source-backed type definition carried from the docs generator into the API table.
 * Nested navigation beyond the linked root alias is follow-up #822.
 */
export interface TypeDefinition {
	/** Declared type alias or interface name, e.g. `RequiredInitialResponsiveValue`. */
	name: string;
	/**
	 * TypeScript source for the definition, taken from the declaring syntax node — not a handwritten
	 * mirror. Shown in the type popover.
	 */
	definition: string;
	/** Repo-relative path of the declaring file, when known. */
	filePath?: string;
}

/** Build-time registry of linked type aliases for one generated props table. */
export type TypeDefinitionsPayload = Record<string, TypeDefinition>;

/**
 * GeneratedDoc plus a side-channel registry. Definitions are not DocEntry rows — they must not appear
 * in the props table, processed Markdown, or search indexes.
 */
export type EnrichedGeneratedDoc = GeneratedDoc & {
	typeDefinitions?: TypeDefinitionsPayload;
};

/** Public URL prefix for per-table definition JSON written at MDX compile time. */
export const TYPE_DEFINITIONS_PUBLIC_DIR = 'type-definitions';

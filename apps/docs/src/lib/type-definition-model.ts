import type { GeneratedDoc } from 'fumadocs-typescript';
import * as z from 'zod';

/** Source-backed type definition shown in an API table popover. */
export interface TypeDefinition {
	/** Declared alias or interface name. */
	name: string;
	/** TypeScript source for the declaration. */
	definition: string;
	/** Repo-relative path of the declaring file, when known. */
	filePath?: string;
}

/** Build-time registry of linked type aliases for one generated props table. */
export type TypeDefinitionsPayload = Record<string, TypeDefinition>;

/**
 * GeneratedDoc plus a side-channel registry. Definitions are not DocEntry rows — they must not
 * appear in the props table, processed Markdown, or search indexes.
 */
export type EnrichedGeneratedDoc = GeneratedDoc & {
	typeDefinitions?: TypeDefinitionsPayload;
};

/** Public URL prefix for per-table definition JSON written at MDX compile time. */
export const TYPE_DEFINITIONS_PUBLIC_DIR = 'type-definitions';

const typeDefinitionSchema = z.object({
	definition: z.string(),
	filePath: z.string().optional(),
	name: z.string().min(1),
});

const typeDefinitionsPayloadSchema = z.record(z.string(), typeDefinitionSchema);

/** Parses a fetched JSON value into a type-definitions payload, or throws. */
export function parseTypeDefinitionsPayload(value: unknown): TypeDefinitionsPayload {
	const parsed = typeDefinitionsPayloadSchema.safeParse(value);
	if (!parsed.success) {
		throw new Error('Invalid type definitions payload');
	}
	return parsed.data;
}

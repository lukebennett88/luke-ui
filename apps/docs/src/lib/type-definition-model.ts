/**
 * Source-backed type definition carried from the docs generator into the API table and Markdown.
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

/** Synthetic GeneratedDoc entry that carries the type-definition registry to the client table. */
export const TYPE_DEFINITIONS_KEY = '__lukeTypeDefinitions';

/** JSON payload stored on the reserved entry's `typeHref` (becomes `typeDescriptionLink`). */
export type TypeDefinitionsPayload = Record<string, TypeDefinition>;

export function encodeTypeDefinitions(definitions: TypeDefinitionsPayload): string {
	return JSON.stringify(definitions);
}

export function decodeTypeDefinitions(payload: string | undefined): TypeDefinitionsPayload {
	if (payload === undefined || payload.length === 0) return {};
	try {
		const parsed: unknown = JSON.parse(payload);
		if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
		return parsed as TypeDefinitionsPayload;
	} catch {
		return {};
	}
}

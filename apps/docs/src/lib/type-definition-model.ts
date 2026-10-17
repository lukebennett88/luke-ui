import type { GeneratedDoc } from 'fumadocs-typescript';
import * as z from 'zod';

const typeDefinitionSchema = z.object({
	/**
	 * TypeScript source of the declaration. Absent for an indexed access, which has no declaration of
	 * its own, and for an external type that is not a short type alias.
	 */
	definition: z.string().optional(),
	/** Package that declares an external type, such as `react-aria-components`. Absent for Luke UI. */
	module: z.string().optional(),
	/** Declared type name, or indexed access text such as `SprinklesProps['gap']`. */
	name: z.string().min(1),
	/** Keys of the other definitions that `definition` or `resolved` names, in order of appearance. */
	references: z.array(z.string()),
	/**
	 * The checker's expansion, kept when the declaration alone does not show the accepted values,
	 * such as `keyof typeof responsiveConditions`.
	 */
	resolved: z.string().optional(),
	/** File that declares an external type, relative to its package root. */
	source: z.string().optional(),
	/** Other names the signatures and definitions write for this type, such as an import's alias. */
	writtenAs: z.array(z.string()).optional(),
});

const typeDefinitionsPayloadSchema = z.record(z.string(), typeDefinitionSchema);

/** One named type that a props table's signatures or definitions refer to. */
export type TypeDefinition = z.infer<typeof typeDefinitionSchema>;

/**
 * Types one generated props table refers to, keyed by name. Luke UI types are followed through their
 * definitions, so every Luke UI type a definition names has its own key.
 */
export type TypeDefinitionsPayload = z.infer<typeof typeDefinitionsPayloadSchema>;

/**
 * GeneratedDoc plus the definitions its rows refer to. The definitions are not DocEntry rows, so they
 * stay out of the props table and search. Processed Markdown lists them after the table.
 */
export type EnrichedGeneratedDoc = GeneratedDoc & {
	typeDefinitions?: TypeDefinitionsPayload;
};

/** Validates a generated model at build time, or throws. The browser never loads this schema. */
export function parseTypeDefinitionsPayload(value: unknown): TypeDefinitionsPayload {
	const parsed = typeDefinitionsPayloadSchema.safeParse(value);
	if (!parsed.success) throw new Error('Invalid type definitions payload');
	return parsed.data;
}

/**
 * One table's JSON asset: only the types its rows link to, with only the text a popover shows. The
 * browser imports this module for types alone, so the schema above stays out of its bundle.
 */
export type LinkedTypeDefinitions = Record<string, Pick<TypeDefinition, 'definition' | 'resolved'>>;

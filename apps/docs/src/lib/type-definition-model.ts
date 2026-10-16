import type { GeneratedDoc } from 'fumadocs-typescript';
import * as z from 'zod';

const typeDefinitionsPayloadSchema = z.record(
	z.string(),
	z.object({
		/** TypeScript source of the declaration. */
		definition: z.string(),
		/** Declared alias name. */
		name: z.string().min(1),
	}),
);

/** Linked type aliases of one generated props table, keyed by alias name. */
export type TypeDefinitionsPayload = z.infer<typeof typeDefinitionsPayloadSchema>;

/**
 * GeneratedDoc plus the definitions its rows link to. The definitions are not DocEntry rows, so they
 * stay out of the props table, processed Markdown, and search.
 */
export type EnrichedGeneratedDoc = GeneratedDoc & {
	typeDefinitions?: TypeDefinitionsPayload;
};

/** Parses a fetched JSON value into a type-definitions payload, or throws. */
export function parseTypeDefinitionsPayload(value: unknown): TypeDefinitionsPayload {
	const parsed = typeDefinitionsPayloadSchema.safeParse(value);
	if (!parsed.success) throw new Error('Invalid type definitions payload');
	return parsed.data;
}

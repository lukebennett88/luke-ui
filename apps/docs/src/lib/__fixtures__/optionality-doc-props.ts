/**
 * Optionality controls: optional, optional-with-explicit-undefined, and required-with-undefined
 * must not be treated as equivalent when exactOptionalPropertyTypes distinctions matter.
 */
export interface OptionalityDocProps {
	/** Optional without writing `| undefined`. */
	first?: string;
	/** Optional and explicitly accepts `undefined`. */
	second?: string | undefined;
	/** Required but explicitly accepts `undefined`. */
	third: string | undefined;
	/** Nested `| undefined` inside a generic must not be stripped. */
	nested?: AliasHoldingUndefined;
	/** External/unresolved name: no popover when the definition is not in Luke UI. */
	external?: Promise<string>;
}

/** Holds an inner `| undefined` that enrichment must leave alone. */
export type AliasHoldingUndefined = ReadonlyArray<string | undefined>;

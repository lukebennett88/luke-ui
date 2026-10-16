/** Declared alias over a union. Optional props flatten this for fumadocs' simplifiedType. */
export type AliasOfUnion = string | number;

/** Fixture for docs generator regression around optional alias-of-union props. */
export interface OptionalAliasDocProps {
	/** Optional alias-of-union: must keep the alias rather than `union`. */
	aliased?: AliasOfUnion;
	/** Unaffected optional primitive: simplifiedType stays `string`. */
	label?: string;
	/** Required alias control: already correct and must stay unchanged. */
	requiredAliased: AliasOfUnion;
}

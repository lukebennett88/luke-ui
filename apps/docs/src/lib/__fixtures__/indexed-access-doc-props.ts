/**
 * Indexed-access annotations that resolve with or without an explicit `| undefined` in the value
 * type. Enrichment must not treat checker-admitted undefined as compiler-implied optionality.
 */
interface Holder {
	plain: string;
	withUndefined: string | undefined;
}

export interface IndexedAccessDocProps {
	/** Optional indexed access whose target does not admit undefined. */
	optionalPlain?: Holder['plain'];
	/** Optional indexed access whose target explicitly admits undefined. */
	optionalWithUndefined?: Holder['withUndefined'];
	/** Required indexed access whose target explicitly admits undefined. */
	requiredWithUndefined: Holder['withUndefined'];
}

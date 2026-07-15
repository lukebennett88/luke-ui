/**
 * Expands an object type into a more readable representation.
 */
export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

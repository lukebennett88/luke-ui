/**
 * Strips Panda codegen's `ConditionalValue` wrapper (responsive arrays and
 * condition objects) from a generated recipe's variant props. Luke UI recipes
 * take plain values only.
 */
export type PlainVariants<VariantProps> = {
	[Key in keyof VariantProps]?: Extract<VariantProps[Key], string | number | boolean>;
};

import type { GlobalStyleRule, StyleRule } from '@vanilla-extract/css';
import { globalStyle as vanillaGlobalStyle, style as vanillaStyle } from '@vanilla-extract/css';
import { recipe as vanillaRecipe } from '@vanilla-extract/recipes';
import type { DistributiveOmit } from '../types.js';
import type { LayerName } from './layers.css.js';
import { layers } from './layers.css.js';

type LayeredStyleRule = DistributiveOmit<StyleRule, '@layer'>;
type LayeredGlobalStyleRule = DistributiveOmit<GlobalStyleRule, '@layer'>;
type RecipeStyleRule = LayeredStyleRule | string;
type RecipeVariantDefinitions = Record<string, RecipeStyleRule>;
type RecipeVariantGroups = Record<string, RecipeVariantDefinitions>;
type BooleanMap<T> = T extends 'true' | 'false' ? boolean : T;
type RecipeVariantSelection<Variants extends RecipeVariantGroups> = {
	[VariantGroup in keyof Variants]?: BooleanMap<keyof Variants[VariantGroup]> | undefined;
};
type RecipeCompoundVariant<Variants extends RecipeVariantGroups> = {
	variants: RecipeVariantSelection<Variants>;
	style: RecipeStyleRule;
};
type RecipeOptions<Variants extends RecipeVariantGroups> = {
	base?: RecipeStyleRule;
	variants?: Variants;
	defaultVariants?: RecipeVariantSelection<Variants>;
	compoundVariants?: Array<RecipeCompoundVariant<Variants>>;
};

function withLayer(layer: LayerName, rule: LayeredStyleRule): StyleRule {
	return {
		'@layer': {
			[layers[layer]]: rule,
		},
	};
}

function withLayerGlobal(layer: LayerName, rule: LayeredGlobalStyleRule): GlobalStyleRule {
	return {
		'@layer': {
			[layers[layer]]: rule,
		},
	};
}

function withLayerIfStyleRule(layer: LayerName, styleRule: RecipeStyleRule): RecipeStyleRule {
	return typeof styleRule === 'string' ? styleRule : withLayer(layer, styleRule);
}

export function globalStyleInLayer(
	layer: LayerName,
	selector: string,
	rule: LayeredGlobalStyleRule,
): void {
	vanillaGlobalStyle(selector, withLayerGlobal(layer, rule));
}

export function styleInLayer(layer: LayerName, rule: LayeredStyleRule, debugId?: string): string {
	return vanillaStyle(withLayer(layer, rule), debugId);
}

export function recipeInLayer<Variants extends RecipeVariantGroups>(
	layer: LayerName,
	options: RecipeOptions<Variants>,
	debugId?: string,
) {
	const layeredVariants =
		options.variants === undefined
			? undefined
			: (Object.fromEntries(
					Object.entries(options.variants).map(([variantName, variantValues]) => [
						variantName,
						Object.fromEntries(
							Object.entries(variantValues).map(([variantValue, styleRule]) => [
								variantValue,
								withLayerIfStyleRule(layer, styleRule),
							]),
						),
					]),
				) as Variants);

	const layeredCompoundVariants =
		options.compoundVariants === undefined
			? undefined
			: options.compoundVariants.map((compound) => ({
					...compound,
					style: withLayerIfStyleRule(layer, compound.style),
				}));

	return vanillaRecipe<Variants>(
		{
			...options,
			...(options.base === undefined ? {} : { base: withLayerIfStyleRule(layer, options.base) }),
			...(layeredVariants === undefined ? {} : { variants: layeredVariants }),
			...(layeredCompoundVariants === undefined
				? {}
				: { compoundVariants: layeredCompoundVariants }),
		},
		debugId,
	);
}

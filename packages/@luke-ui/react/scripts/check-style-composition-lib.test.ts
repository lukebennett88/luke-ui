import { expect, test } from 'vite-plus/test';
import { findStyleCompositionViolations } from './check-style-composition-lib.js';

test('flags a hand-written cx(recipe.className, ...) recomposition', () => {
	const violations = findStyleCompositionViolations([
		{
			file: 'spinner.tsx',
			source: `
				return <span className={cx(parts.root.className, className)} />;
			`,
		},
	]);

	expect(violations).toEqual([
		{
			file: 'spinner.tsx',
			line: 2,
			message: expect.stringContaining('composeRecipeProps'),
		},
	]);
});

test('flags mergeProps and mergeStyleProps wrapping resolveRecipeSlotProps or a *Recipe call', () => {
	const violations = findStyleCompositionViolations([
		{
			file: 'a.tsx',
			source: `
				return <div {...mergeProps(resolveRecipeSlotProps(fieldRecipe, 'root'), { className, style })} />;
			`,
		},
		{
			file: 'b.tsx',
			source: `
				return <div {...mergeStyleProps(buttonRecipe({ size }), { className, style })} />;
			`,
		},
	]);

	expect(violations).toEqual([
		{ file: 'a.tsx', line: 2, message: expect.stringContaining('composeRecipeProps') },
		{ file: 'b.tsx', line: 2, message: expect.stringContaining('composeRecipeProps') },
	]);
});

test('flags a manual style ternary recomposing recipe style', () => {
	const violations = findStyleCompositionViolations([
		{
			file: 'spinner.tsx',
			source: `
				style={parts.root.style === undefined ? style : { ...parts.root.style, ...style }}
			`,
		},
	]);

	expect(violations).toEqual([
		{ file: 'spinner.tsx', line: 2, message: expect.stringContaining('composeRecipeProps') },
	]);
});

test('does not flag the converted composeRecipeProps shape', () => {
	const violations = findStyleCompositionViolations([
		{
			file: 'code.tsx',
			source: `
				const recipeProps = codeRecipe({ xstyle });
				return <code {...elementProps} {...composeRecipeProps(recipeProps, { className, style })} />;
			`,
		},
		{
			file: 'checkbox.tsx',
			source: `
				const mergedProps = mergeStyleProps(recipeProps, domProps) as typeof domProps;
			`,
		},
	]);

	expect(violations).toEqual([]);
});

test('does not flag cx() concatenating a plain constant with a consumer className', () => {
	const violations = findStyleCompositionViolations([
		{
			file: 'mobile-overlay.tsx',
			source: `
				className={cx(rootClassName, overlay.className)}
			`,
		},
	]);

	expect(violations).toEqual([]);
});

/**
 * Flags hand-rolled recomposition of recipe `className`/`style` output in component sources —
 * the exact boilerplate `composeRecipeProps` / `composeRacRecipeProps` replace. See
 * `docs/STYLING.md#xstyle` for the intended composition shape.
 */

export type StyleCompositionViolation = {
	file: string;
	line: number;
	message: string;
};

/**
 * A manually recomposed `className`: `cx(something.className, ...)` instead of composing through
 * `composeRecipeProps` / `composeRacRecipeProps`. Anchored to the first argument so a legitimate
 * `cx(rootClassName, consumer.className)` — concatenating a plain constant with a consumer's
 * className, not a recipe's — does not match.
 */
const HAND_ROLLED_CLASS_NAME_PATTERN = /\bcx\(\s*[\w$]+(?:\.[\w$]+)*\.className\b/g;

/**
 * `mergeProps(...)` or `mergeStyleProps(...)` wrapping a `resolveRecipeSlotProps(...)` or
 * `*Recipe(...)` call as its first argument — the manual merge `composeRecipeProps` replaces.
 */
const HAND_ROLLED_MERGE_PATTERN =
	/\b(?:mergeProps|mergeStyleProps)\(\s*(?:resolveRecipeSlotProps\(|[\w$]*Recipe\()/g;

/**
 * A manual ternary recomposing recipe `style`, such as
 * `recipeProps.style === undefined ? style : { ...recipeProps.style, ...style }`.
 */
const HAND_ROLLED_STYLE_TERNARY_PATTERN =
	/[\w$]+(?:\.[\w$]+)*\.style\s*===\s*undefined\s*\?[\s\S]*?:\s*\{\s*\.\.\.[\w$]+(?:\.[\w$]+)*\.style\b/g;

const VIOLATION_MESSAGE =
	'Use composeRecipeProps / composeRacRecipeProps instead of hand-composing recipe className/style.';

/** Returns the 1-indexed line containing `index` in `source`. */
function lineAt(source: string, index: number): number {
	return source.slice(0, index).split('\n').length;
}

function findPatternViolations(
	file: string,
	source: string,
	pattern: RegExp,
): Array<StyleCompositionViolation> {
	const violations: Array<StyleCompositionViolation> = [];
	for (const match of source.matchAll(pattern)) {
		violations.push({ file, line: lineAt(source, match.index), message: VIOLATION_MESSAGE });
	}
	return violations;
}

/**
 * Scans component sources for hand-rolled recipe `className`/`style` recomposition. Takes file
 * contents directly so the caller decides which files qualify (component `.tsx` sources, excluding
 * tests, stories, and the `src/core/styles/` helper implementations that legitimately contain these
 * constructs).
 */
export function findStyleCompositionViolations(
	files: Array<{ file: string; source: string }>,
): Array<StyleCompositionViolation> {
	const violations: Array<StyleCompositionViolation> = [];

	for (const { file, source } of files) {
		violations.push(
			...findPatternViolations(file, source, HAND_ROLLED_CLASS_NAME_PATTERN),
			...findPatternViolations(file, source, HAND_ROLLED_MERGE_PATTERN),
			...findPatternViolations(file, source, HAND_ROLLED_STYLE_TERNARY_PATTERN),
		);
	}

	return violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

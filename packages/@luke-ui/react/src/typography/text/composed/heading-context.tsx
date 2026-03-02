import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
const MIN_LEVEL = 1;
const DEFAULT_LEVEL = 2;

/** Clamp a number to the valid heading range. */
const clampLevel = (n: number): HeadingLevel =>
	Math.max(MIN_LEVEL, Math.min(6, n)) as HeadingLevel;

/**
 * Context for heading levels (1–6).
 *
 * Ensures headings adjust based on where a component is rendered.
 * This keeps the outline semantic and accessible without hard-coding levels.
 *
 * How it works:
 * - At the root, set a base level, if no base level is set, the default level is 2.
 * - Children read that level and render the right <h*>.
 * - Nested sections wrap in another provider to bump the level.
 *
 * Moving components around won’t break the heading structure.
 */
const HeadingLevelContext = createContext<HeadingLevel | undefined>(undefined);
const WithinHeadingContext = createContext(false);

export type HeadingLevelsRenderProps = {
	element: `h${HeadingLevel}`;
	level: HeadingLevel;
};

/**
 * Get the current heading level from context.
 *
 * @param fallback - Level to use when no provider is found (defaults to 2)
 * @returns An object with the current heading level and element from context, or the fallback value
 */
export const useHeadingLevel = (
	fallback: HeadingLevel = DEFAULT_LEVEL,
): HeadingLevelsRenderProps => {
	const level = useContext(HeadingLevelContext) ?? fallback;
	return {
		level,
		element: `h${level}`,
	};
};

export const useIsWithinHeading = () => useContext(WithinHeadingContext);

type HeadingLevelsProps = {
	/** Base level at the root. Omit to auto-increment from parent. */
	base?: HeadingLevel;
	children: ReactNode | ((props: HeadingLevelsRenderProps) => ReactNode);
};

/**
 * Provides heading levels to a subtree.
 *
 * - If there’s no parent and no `base`, defaults to level 2
 * - With a parent, omitting `base` auto-increments by 1 (capped at level 6)
 *
 * @example
 * ```tsx
 * // Root sets base=2
 * <HeadingLevels base={2}>
 *   <Title />                  // <h2>
 *   <HeadingLevels>
 *     <SubTitle />             // <h3>
 *     <HeadingLevels>
 *       <SubSubTitle />        // <h4>
 *     </HeadingLevels>
 *   </HeadingLevels>
 *   <AnotherTitle />           // <h2>
 * </HeadingLevels>
 * ```
 *
 * @example
 * ```tsx
 * // Using render prop to access level and element
 * <HeadingLevels base={2}>
 *   {({ level, element }) => (
 *     <Heading as={element} level={level}>
 *       Dynamic Heading
 *     </Heading>
 *   )}
 * </HeadingLevels>
 * ```
 */
export const HeadingLevels = ({ base, children }: HeadingLevelsProps) => {
	const parent = useContext(HeadingLevelContext); // raw context to detect "no parent"
	const value = (() => {
		if (parent === undefined) return clampLevel(base ?? DEFAULT_LEVEL); // root
		if (base !== undefined) return clampLevel(base); // override
		return clampLevel(parent + 1); // auto-increment
	})();

	const renderProps: HeadingLevelsRenderProps = {
		level: value,
		element: `h${value}`,
	};

	return (
		<HeadingLevelContext.Provider value={value}>
			{typeof children === 'function' ? children(renderProps) : children}
		</HeadingLevelContext.Provider>
	);
};

type HeadingPresenceProviderProps = {
	children: ReactNode;
};

export function HeadingPresenceProvider({
	children,
}: HeadingPresenceProviderProps) {
	return (
		<WithinHeadingContext.Provider value={true}>
			{children}
		</WithinHeadingContext.Provider>
	);
}

import { iconRecipe } from '@luke-ui/react/icon';
import type { ComponentProps, JSX } from 'react';

/**
 * Chain link glyph. Kept local to the docs app because `@luke-ui/react`'s icon set has no link icon.
 * Drawn with the same viewBox, 1.5 stroke, and round caps and joins as the built-in icons.
 */
export function LinkIcon({ className, ...props }: ComponentProps<'svg'>): JSX.Element {
	return (
		<svg
			aria-hidden
			className={iconRecipe({ className })}
			fill="currentColor"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path
				d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
			/>
		</svg>
	);
}

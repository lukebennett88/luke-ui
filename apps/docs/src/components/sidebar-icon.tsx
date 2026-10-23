import { createIcon } from '@luke-ui/react/icon';

/**
 * A panel with a divider near its inline-start edge, for the docs sidebar toggle. Drawn on the Luke
 * UI icon grid (24 viewBox, 1.5 stroke, round caps and joins), but kept local to the docs app because
 * `@luke-ui/react`'s spritesheet holds glyphs its own components use.
 */
export const SidebarIcon = createIcon({
	path: (
		<path
			d="M3.75 6.75A2.25 2.25 0 0 1 6 4.5h12a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 18 19.5H6a2.25 2.25 0 0 1-2.25-2.25V6.75ZM9 4.5v15"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={1.5}
		/>
	),
});

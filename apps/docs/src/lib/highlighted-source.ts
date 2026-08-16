/**
 * The build-time highlight plugin exports this value for a `?highlight` TSX import.
 */
export type HighlightedSource = {
	/** Shiki markup for the `<code>` element inside Fumadocs `Pre`. */
	html: string;
	/** URL hash that opens this source in the playground, or null when it cannot run there. */
	playgroundHash: string | null;
};

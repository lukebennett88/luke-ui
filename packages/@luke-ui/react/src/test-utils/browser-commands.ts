import type {} from 'vite-plus/test/internal/browser';

declare module 'vitest/internal/browser' {
	interface BrowserCommands {
		/** Moves the pointer onto `selector` without scrolling it into view. */
		movePointerTo: (selector: string) => Promise<void>;
		/** Presses the primary pointer button on `selector` without scrolling it into view. */
		holdPointerDown: (selector: string) => Promise<void>;
		/** Releases the primary pointer button. */
		releasePointer: () => Promise<void>;
	}
}

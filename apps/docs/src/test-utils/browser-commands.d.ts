declare module 'vitest/internal/browser' {
	interface BrowserCommands {
		dragFromSeparator: (offsetX: number, dragBy: number) => Promise<void>;
	}
}

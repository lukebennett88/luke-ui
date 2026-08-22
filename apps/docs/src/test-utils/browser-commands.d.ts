declare module 'vitest/internal/browser' {
	interface BrowserCommands {
		clickExamplePreviewButton: (name: string) => Promise<void>;
		clickExamplePreviewOption: (name: string) => Promise<void>;
		dragFromSeparator: (offsetX: number, dragBy: number) => Promise<void>;
	}
}

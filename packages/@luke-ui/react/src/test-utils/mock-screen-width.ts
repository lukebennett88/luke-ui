/**
 * Forces `useIsMobileDevice` to report a mobile device, since that hook reads
 * `window.screen.width` rather than the window width. Returns a restore
 * function that puts the original descriptor back, including the case where
 * `window.screen.width` did not previously exist.
 */
export function mockScreenWidth(width: number) {
	const descriptor = Object.getOwnPropertyDescriptor(window.screen, 'width');
	Object.defineProperty(window.screen, 'width', { configurable: true, value: width });

	return () => {
		if (descriptor == null) {
			Reflect.deleteProperty(window.screen, 'width');
			return;
		}
		Object.defineProperty(window.screen, 'width', descriptor);
	};
}

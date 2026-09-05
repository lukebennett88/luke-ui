import * as stylex from '@stylexjs/stylex';

/** StyleX constants for the shared invalid-indicator mask and forced-colours background. */
export const invalidIndicator = stylex.defineConsts({
	maskImage:
		'url("data:image/svg+xml,%3Csvg%20fill%3D%22none%22%20stroke%3D%22black%22%20stroke-width%3D%221.5%22%20viewBox%3D%220%200%2024%2024%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20%3E%0A%20%20%3Cpath%20d%3D%22M12%209v3.75m-9.303%203.376c-.866%201.5.217%203.374%201.948%203.374h14.71c1.73%200%202.813-1.874%201.948-3.374L13.949%203.378c-.866-1.5-3.032-1.5-3.898%200L2.697%2016.126ZM12%2015.75h.007v.008H12v-.008Z%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20%2F%3E%0A%3C%2Fsvg%3E%0A")',
	// Keep the icon visible when author colours are ignored.
	forcedColorsBackgroundColor: 'CanvasText',
});

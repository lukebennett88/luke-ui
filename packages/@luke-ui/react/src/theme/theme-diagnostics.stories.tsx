import { userEvent } from 'storybook/test';
import preview from '../../.storybook/preview.js';
import { ThemeDiagnosticsInspector } from './theme-diagnostics-inspector.js';

const meta = preview.meta({
	component: ThemeDiagnosticsStory,
	tags: ['theme'],
	title: 'Theme/Diagnostics',
});

/**
 * Inspect compiler diagnostics for the bundled themes. This view is not public API.
 * Click Paper so the accessibility scan covers a second theme profile.
 */
export const Inspector = meta.story({
	play: async ({ canvas }) => {
		await userEvent.click(canvas.getByRole('radio', { name: 'paper' }));
	},
});

function ThemeDiagnosticsStory() {
	return <ThemeDiagnosticsInspector />;
}

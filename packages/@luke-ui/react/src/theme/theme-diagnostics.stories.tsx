import { expect, userEvent, within } from 'storybook/test';
import preview from '../../.storybook/preview.js';
import { ThemeDiagnosticsInspector } from './theme-diagnostics-inspector.js';

const meta = preview.meta({
	component: ThemeDiagnosticsStory,
	tags: ['theme'],
	title: 'Theme/Diagnostics',
});

/**
 * Inspect compiler diagnostics for the bundled themes. This view is not public API.
 */
export const Inspector = meta.story({
	play: async ({ canvas }) => {
		await expect(canvas.getByRole('heading', { name: 'Light mode' })).toBeInTheDocument();
		await expect(canvas.getByRole('heading', { name: 'Dark mode' })).toBeInTheDocument();

		const swatches = canvas.getAllByRole('img');
		await expect(swatches.length).toBeGreaterThan(0);

		const lightSolidAnchorTable = canvas.getAllByRole('table')[0]!;
		const accentRow = within(lightSolidAnchorTable).getByRole('row', { name: /^accent / });
		const tactileAccentDiagnostics = accentRow.textContent;

		await userEvent.click(canvas.getByRole('radio', { name: 'paper' }));
		await expect(accentRow).not.toHaveTextContent(tactileAccentDiagnostics ?? '');
	},
});

function ThemeDiagnosticsStory() {
	return <ThemeDiagnosticsInspector />;
}

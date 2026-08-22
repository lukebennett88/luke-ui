import '../styles/app.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { ThemeProvider } from 'next-themes';
import { createRoot } from 'react-dom/client';
import { ExamplePreviewDocument } from '../components/example-preview-runner.js';
import { DocsThemeRoot } from '../components/theme-controls.js';
import ButtonExample from '../examples/button/basic.js';
import ComboboxExample from '../examples/combobox-field/basic.js';

const examples = {
	button: ButtonExample,
	combobox: ComboboxExample,
};

export function mountExamplePreview(
	container: HTMLElement,
	example: keyof typeof examples = 'combobox',
): void {
	const PreviewComponent = examples[example];
	createRoot(container).render(
		<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
			<DocsThemeRoot>
				<ExamplePreviewDocument PreviewComponent={PreviewComponent} />
			</DocsThemeRoot>
		</ThemeProvider>,
	);
}

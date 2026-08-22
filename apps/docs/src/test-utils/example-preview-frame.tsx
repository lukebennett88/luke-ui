import '../styles/app.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { ThemeProvider } from 'next-themes';
import { createRoot } from 'react-dom/client';
import { ExamplePreviewDocument } from '../components/example-preview-runner.js';
import { DocsThemeRoot } from '../components/theme-controls.js';
import ComboboxExample from '../examples/combobox-primitive/basic.js';

export function mountExamplePreview(container: HTMLElement): void {
	createRoot(container).render(
		<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
			<DocsThemeRoot>
				<ExamplePreviewDocument PreviewComponent={ComboboxExample} />
			</DocsThemeRoot>
		</ThemeProvider>,
	);
}

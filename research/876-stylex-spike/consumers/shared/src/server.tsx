import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from '#app';
import { Provider } from '#ui/provider';

/** Renders the selected app to HTML for prerendering. */
export function render(): string {
	return renderToString(
		<StrictMode>
			<Provider>
				<App />
			</Provider>
		</StrictMode>,
	);
}

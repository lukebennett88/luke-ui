import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from '#app';
import { Provider } from '#ui/provider';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root');
const app = (
	<StrictMode>
		<Provider>
			<App />
		</Provider>
	</StrictMode>
);
// Prerendered pages hydrate; the dev server renders from scratch.
if (container.firstElementChild) {
	hydrateRoot(container, app, {
		onRecoverableError(error) {
			// Surfaced to the browser checks, which fail on any hydration mismatch.
			(window as unknown as { __hydrationErrors: Array<string> }).__hydrationErrors.push(
				String(error),
			);
		},
	});
} else {
	createRoot(container).render(app);
}
(window as unknown as { __hydrated: boolean }).__hydrated = true;

import '@luke-ui/react/stylesheet.css';
import '@luke-ui/theme-tactile/fonts.css';
import '@luke-ui/theme-tactile/stylesheet.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Welcome } from './welcome.tsx';

const container = document.getElementById('root');
if (container === null) throw new Error('index.html has no #root element');

createRoot(container).render(
	<StrictMode>
		<Welcome />
	</StrictMode>,
);

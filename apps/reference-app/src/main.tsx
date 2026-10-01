import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRouter } from './router.js';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root');

createRoot(root).render(
	<StrictMode>
		<AppRouter />
	</StrictMode>,
);

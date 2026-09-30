import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { createAppRoutes } from './routes/app-routes.js';

const queryClient = new QueryClient();
const router = createBrowserRouter(createAppRoutes(queryClient));

export function AppRouter() {
	return (
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>
	);
}

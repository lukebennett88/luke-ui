import './styles/global.css.js';
import '@luke-ui/react/stylesheet.css';
import 'virtual:visual-review-theme.css';
import { Box } from '@luke-ui/react/box';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { Suspense } from 'react';
import { RouterProvider } from 'react-aria-components';
import { DashboardPage } from './dashboard/dashboard-page.js';
import { navigate, useLocationSearch } from './navigation/location.js';
import { parseReportSource, reportSourceKey } from './report/report-source.js';
import { ReviewPage } from './review/review-page.js';

export function App() {
	const search = useLocationSearch();
	const source = parseReportSource(search);

	return (
		<RouterProvider navigate={navigate}>
			<Suspense fallback={<PageLoading />}>
				{source ? <ReviewPage key={reportSourceKey(source)} source={source} /> : <DashboardPage />}
			</Suspense>
		</RouterProvider>
	);
}

function PageLoading() {
	return (
		<Box
			alignItems="center"
			display="flex"
			justifyContent="center"
			style={{ minBlockSize: '100dvh' }}
		>
			<LoadingSpinner aria-label="Loading" />
		</Box>
	);
}

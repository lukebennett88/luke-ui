import './styles/global.css.js';
import '@luke-ui/react/stylesheet.css';
import '@luke-ui/theme-tactile/fonts.css';
import '@luke-ui/theme-tactile/stylesheet.css';
import { Box } from '@luke-ui/react/box';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { Suspense } from 'react';
import { RouterProvider } from 'react-aria-components';
import { AppHeader } from './app-header.js';
import { DashboardPage } from './dashboard/dashboard-page.js';
import { navigate, useLocationSearch } from './navigation/location.js';
import { parseReportSource, reportSourceKey } from './report/report-source.js';
import { ReviewPage } from './review/review-page.js';

export function App() {
	const search = useLocationSearch();
	const source = parseReportSource(search);

	return (
		<RouterProvider navigate={navigate}>
			<Box blockSize="100%" display="flex" flexDirection="column">
				<AppHeader />
				<Box display="flex" elementType="main" flexDirection="column" flexGrow="1" minBlockSize="0">
					<Suspense fallback={<PageLoading />}>
						{source ? (
							<ReviewPage key={reportSourceKey(source)} source={source} />
						) : (
							<DashboardPage />
						)}
					</Suspense>
				</Box>
			</Box>
		</RouterProvider>
	);
}

function PageLoading() {
	return (
		<Box alignItems="center" display="flex" flexGrow="1" justifyContent="center">
			<LoadingSpinner aria-label="Loading report" />
		</Box>
	);
}

import '../styles/global.css';
import '@luke-ui/react/stylesheet.css';
import 'virtual:reference-theme.css';
import { Provider } from '@luke-ui/react/provider';
import spritesheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { RouterProvider } from 'react-aria-components';
import { Outlet, useHref, useNavigate } from 'react-router';

export function RootLayout() {
	const navigate = useNavigate();

	return (
		<RouterProvider navigate={navigate} useHref={useHref}>
			<Provider spritesheetHref={spritesheetHref}>
				<Outlet />
			</Provider>
		</RouterProvider>
	);
}

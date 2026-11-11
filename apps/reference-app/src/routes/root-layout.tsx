import '../styles/global.css';
import '@luke-ui/react/stylesheet.css';
import 'virtual:reference-theme.css';
import { Provider } from '@luke-ui/react/provider';
import spritesheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { RouterProvider } from 'react-aria-components';
import { Outlet, useHref, useNavigate } from 'react-router';
import { useApplyInterfaceSettings } from '../settings/preferences/use-apply-interface-settings.js';

/** The single place that applies interface preferences, so the first paint is already correct. */
export function RootLayout() {
	const navigate = useNavigate();
	useApplyInterfaceSettings();

	return (
		<RouterProvider navigate={navigate} useHref={useHref}>
			<Provider spritesheetHref={spritesheetHref}>
				<Outlet />
			</Provider>
		</RouterProvider>
	);
}

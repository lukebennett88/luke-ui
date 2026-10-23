import '../styles/global.css';
import '@luke-ui/react/stylesheet.css';
import 'virtual:reference-theme.css';
import { Provider } from '@luke-ui/react/provider';
import spritesheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { useMutationState, useQuery } from '@tanstack/react-query';
import { useLayoutEffect, useMemo } from 'react';
import { RouterProvider } from 'react-aria-components';
import { Outlet, useHref, useNavigate } from 'react-router';
import type { Preferences } from '../api/schemas.js';
import { applyInterfaceSettings } from '../api/settings-api.js';
import { PREFERENCES_MUTATION_KEY, settingsQueryOptions } from '../api/settings-query.js';

/** The single place that applies interface preferences, so the first paint is already correct. */
export function RootLayout() {
	const navigate = useNavigate();
	const settings = useQuery(settingsQueryOptions).data!;
	const pendingPreferences = useMutationState({
		filters: { mutationKey: PREFERENCES_MUTATION_KEY, status: 'pending' },
		select: (mutation) => mutation.state.variables as Partial<Preferences> | undefined,
	});
	const preferences = useMemo(() => {
		const latestPending = pendingPreferences.at(-1);
		return latestPending ? { ...settings.preferences, ...latestPending } : settings.preferences;
	}, [pendingPreferences, settings.preferences]);

	useLayoutEffect(() => {
		applyInterfaceSettings(preferences);
	}, [preferences]);

	return (
		<RouterProvider navigate={navigate} useHref={useHref}>
			<Provider spritesheetHref={spritesheetHref}>
				<Outlet />
			</Provider>
		</RouterProvider>
	);
}

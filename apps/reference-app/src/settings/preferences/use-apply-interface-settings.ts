import { useMutationState, useQuery } from '@tanstack/react-query';
import { useLayoutEffect, useMemo } from 'react';
import { settingsQueryOptions } from '../settings-query.js';
import { applyInterfaceSettings } from './apply-interface-settings.js';
import { PREFERENCES_MUTATION_KEY } from './preferences-mutation.js';
import type { Preferences } from './schema.js';

export function useApplyInterfaceSettings() {
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
}

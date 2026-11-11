import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { settingsApi } from '../settings-api.js';
import { settingsQueryKey } from '../settings-query.js';
import type { Preferences } from './schema.js';

export const PREFERENCES_MUTATION_KEY = [...settingsQueryKey, 'preferences'] as const;

export function usePreferencesMutation(settings: Preferences) {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: (patch: Partial<Preferences>) => settingsApi.updatePreferences(patch),
		mutationKey: PREFERENCES_MUTATION_KEY,
		onSuccess: (nextSettings) => queryClient.setQueryData(settingsQueryKey, nextSettings),
	});
	const isPreferencesPending =
		useIsMutating({ exact: true, mutationKey: PREFERENCES_MUTATION_KEY }) > 0;
	const preferences = useMemo(() => {
		return mutation.isPending ? { ...settings, ...mutation.variables } : settings;
	}, [mutation.isPending, mutation.variables, settings]);

	function savePreferences(patch: Partial<Preferences>) {
		if (isPreferencesPending) return;
		mutation.reset();
		mutation.mutate(patch);
	}

	return {
		isPreferencesPending,
		preferences,
		preferencesError: mutation.error instanceof Error ? mutation.error.message : undefined,
		resetPreferencesStatus: mutation.reset,
		savePreferences,
	};
}

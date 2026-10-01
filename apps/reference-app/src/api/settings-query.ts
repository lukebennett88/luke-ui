import { queryOptions } from '@tanstack/react-query';
import { settingsApi } from './settings-api.js';

export const settingsQueryOptions = queryOptions({
	queryKey: ['settings'],
	queryFn: () => settingsApi.getSettings(),
	staleTime: 'static',
});

export const settingsQueryKey = settingsQueryOptions.queryKey;

/** Shared by the preferences mutation and the root layout's optimistic preview. */
export const PREFERENCES_MUTATION_KEY = [...settingsQueryKey, 'preferences'] as const;

import type { QueryClient } from '@tanstack/react-query';
import { queryOptions } from '@tanstack/react-query';
import { DEFAULT_SETTINGS } from './schemas.js';
import type { Settings } from './schemas.js';
import { settingsApi } from './settings-api.js';

export const settingsQueryKey = ['settings'] as const;

export const settingsQueryOptions = queryOptions({
	queryKey: settingsQueryKey,
	queryFn: () => settingsApi.getSettings(),
	staleTime: 'static',
});

export function updateSettingsCache(queryClient: QueryClient, settings: Settings) {
	queryClient.setQueryData(settingsQueryKey, settings);
}

export function resetSettingsCache(queryClient: QueryClient) {
	queryClient.setQueryData(settingsQueryKey, structuredClone(DEFAULT_SETTINGS));
}

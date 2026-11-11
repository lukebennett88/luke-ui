import { queryOptions } from '@tanstack/react-query';
import { settingsApi } from './settings-api.js';

export const settingsQueryOptions = queryOptions({
	queryFn: () => settingsApi.getSettings(),
	queryKey: ['settings'],
	staleTime: 'static',
});

export const settingsQueryKey = settingsQueryOptions.queryKey;

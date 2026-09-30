import { queryOptions } from '@tanstack/react-query';
import { settingsApi } from './settings-api.js';

export const settingsQueryOptions = queryOptions({
	queryKey: ['settings'],
	queryFn: () => settingsApi.getSettings(),
	staleTime: 'static',
});

export const settingsQueryKey = settingsQueryOptions.queryKey;

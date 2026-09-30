import type { QueryClient } from '@tanstack/react-query';
import { SettingsMutationError } from './settings-api.js';

export function isSettingsMutationPending(
	queryClient: QueryClient,
	isPending: boolean,
	mutationKey: ReadonlyArray<unknown>,
) {
	return isPending || queryClient.isMutating({ exact: true, mutationKey }) > 0;
}

export function settingsMutationErrorMessage(error: unknown, field?: string) {
	if (error instanceof SettingsMutationError) {
		return (field ? error.fieldErrors?.[field] : undefined) ?? error.message;
	}
	if (error instanceof Error) return error.message;
	return;
}

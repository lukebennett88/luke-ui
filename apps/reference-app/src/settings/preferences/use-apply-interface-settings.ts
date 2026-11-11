import { useMutationState, useQuery } from '@tanstack/react-query';
import { useLayoutEffect, useMemo } from 'react';
import { settingsQueryOptions } from '../settings-query.js';
import { PREFERENCES_MUTATION_KEY } from './preferences-mutation.js';
import { preferenceUpdateSchema } from './schema.js';
import type { Preferences } from './schema.js';

export function useApplyInterfaceSettings() {
	const settings = useQuery(settingsQueryOptions).data!;
	const pendingPreferences = useMutationState({
		filters: { mutationKey: PREFERENCES_MUTATION_KEY, status: 'pending' },
		select: (mutation) => {
			const result = preferenceUpdateSchema.safeParse(mutation.state.variables);
			return result.success ? result.data : undefined;
		},
	});
	const preferences = useMemo(() => {
		const latestPending = pendingPreferences.at(-1);
		return latestPending ? { ...settings.preferences, ...latestPending } : settings.preferences;
	}, [pendingPreferences, settings.preferences]);

	useLayoutEffect(() => {
		applyInterfaceSettings(preferences);
	}, [preferences]);
}

function applyInterfaceSettings(settings: Preferences) {
	const root = document.documentElement;
	if (settings.colorMode === 'system') {
		delete root.dataset.colorMode;
	} else {
		root.dataset.colorMode = settings.colorMode;
	}
	root.dataset.fontSize = settings.fontSize;
	root.dataset.pointerCursor = settings.pointerCursor ? 'true' : 'false';
	root.dataset.underlineLinks = settings.underlineLinks ? 'true' : 'false';
}

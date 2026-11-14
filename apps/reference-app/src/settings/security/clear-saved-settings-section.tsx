import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Dialog } from '@luke-ui/react/dialog';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { DEFAULT_SETTINGS } from '../schemas.js';
import { settingsApi } from '../settings-api.js';
import { settingsQueryKey } from '../settings-query.js';
import { SettingsRow, SettingsSection, SettingsStatus } from '../settings-section.js';

const CLEAR_MUTATION_KEY = [...settingsQueryKey, 'clear'] as const;

type ClearSavedSettingsSectionProps = {
	onCleared: () => void;
};

export function ClearSavedSettingsSection({ onCleared }: ClearSavedSettingsSectionProps) {
	const queryClient = useQueryClient();
	const [isOpen, setIsOpen] = useState(false);
	const isOtherMutationPending =
		useIsMutating({
			mutationKey: settingsQueryKey,
			predicate: (mutation) => mutation.options.mutationKey?.[1] !== 'clear',
		}) > 0;
	const isPending = useIsMutating({ exact: true, mutationKey: CLEAR_MUTATION_KEY }) > 0;
	const mutation = useMutation({
		mutationFn: () => settingsApi.clearLocalSettings(),
		mutationKey: CLEAR_MUTATION_KEY,
		onSuccess: () => {
			queryClient.setQueryData(settingsQueryKey, structuredClone(DEFAULT_SETTINGS));
			onCleared();
		},
	});
	const error = mutation.error instanceof Error ? mutation.error.message : undefined;
	const pendingMessage = isPending ? 'Clearing…' : null;
	const clearedMessage = mutation.isSuccess ? 'Saved settings cleared' : null;

	async function clearSettings() {
		if (!isOpen || isPending || isOtherMutationPending) return;

		mutation.reset();
		try {
			await mutation.mutateAsync();
			setIsOpen(false);
		} catch {
			// Keep the confirmation open so the same action can be retried.
		}
	}

	function changeOpen(next: boolean) {
		if (isPending) return;
		setIsOpen(next);
		if (next) {
			mutation.reset();
		}
	}

	return (
		<>
			<SettingsSection title="Browser data">
				<SettingsRow
					hint="Remove your profile and preferences from this browser."
					label="Saved settings"
				>
					<Button
						isDisabled={isOtherMutationPending}
						onPress={() => changeOpen(true)}
						tone="danger"
					>
						Clear saved settings
					</Button>
					<Dialog
						description="Your profile and preferences will be removed from this browser. This cannot be undone."
						isDismissable={!isPending}
						isKeyboardDismissDisabled={isPending}
						isOpen={isOpen}
						onOpenChange={changeOpen}
						role="alertdialog"
						title="Clear saved settings?"
					>
						<Stack gap={error || isPending || isOtherMutationPending ? 'space.8' : '0'}>
							<Text
								color={error ? 'danger' : 'secondary'}
								elementType="p"
								fontWeight="body"
								role={error ? 'alert' : 'status'}
								shouldDisableTrim
								typography="label"
							>
								{error ?? (isOtherMutationPending ? 'Saving…' : pendingMessage)}
							</Text>
							<Cluster gap="space.8" justifyContent="flex-end">
								<Button isDisabled={isPending} prominence="low" slot="close">
									Cancel
								</Button>
								<Button
									isPending={isPending}
									onPress={() => void clearSettings()}
									prominence="high"
									tone="danger"
								>
									Clear settings
								</Button>
							</Cluster>
						</Stack>
					</Dialog>
				</SettingsRow>
			</SettingsSection>
			<SettingsStatus tone={mutation.isSuccess ? 'success' : undefined}>
				{isOtherMutationPending ? 'Saving…' : clearedMessage}
			</SettingsStatus>
		</>
	);
}

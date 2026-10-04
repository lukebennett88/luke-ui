import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Heading } from '@luke-ui/react/heading';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { rootClassName } from '@luke-ui/react/theme';
import { cx } from '@luke-ui/react/utils';
import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { Dialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Modal, ModalOverlay } from 'react-aria-components/Modal';
import { DEFAULT_SETTINGS } from '../api/schemas.js';
import { settingsApi } from '../api/settings-api.js';
import { settingsQueryKey } from '../api/settings-query.js';
import * as styles from '../styles/settings.css.js';
import { SettingsRow, SettingsSection, SettingsStatus } from './settings-section.js';

const CLEAR_MUTATION_KEY = [...settingsQueryKey, 'clear'] as const;

type ClearSavedSettingsSectionProps = {
	onCleared: () => void;
};

export function ClearSavedSettingsSection({ onCleared }: ClearSavedSettingsSectionProps) {
	const queryClient = useQueryClient();
	const descriptionId = useId();
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
					<DialogTrigger isOpen={isOpen} onOpenChange={changeOpen}>
						<Button isDisabled={isOtherMutationPending} tone="critical">
							Clear saved settings
						</Button>
						<ModalOverlay
							className={cx(rootClassName, styles.dialogOverlay)}
							isDismissable={!isPending}
							isKeyboardDismissDisabled={isPending}
						>
							<Modal className={styles.dialogModal}>
								<Dialog
									aria-describedby={descriptionId}
									aria-label="Clear saved settings?"
									className={styles.dialog}
									role="alertdialog"
								>
									<Stack gap="sp16">
										<Heading level={2} shouldDisableTrim typography="heading3">
											Clear saved settings?
										</Heading>
										<Text color="secondary" elementType="p" id={descriptionId}>
											Your profile and preferences will be removed from this browser. This cannot be
											undone.
										</Text>
										<Stack gap={error || isPending || isOtherMutationPending ? 'sp8' : '0'}>
											<Text
												color={error ? 'danger' : 'secondary'}
												elementType="p"
												fontWeight="body"
												role={error ? 'alert' : 'status'}
												shouldDisableTrim
												typography="label"
											>
												{error ??
													(isOtherMutationPending ? 'Saving…' : isPending ? 'Clearing…' : null)}
											</Text>
											<Cluster gap="sp8" justifyContent="flex-end">
												<Button
													isDisabled={isPending}
													onPress={() => changeOpen(false)}
													prominence="low"
												>
													Cancel
												</Button>
												<Button
													isPending={isPending}
													onPress={() => void clearSettings()}
													prominence="high"
													tone="critical"
												>
													Clear settings
												</Button>
											</Cluster>
										</Stack>
									</Stack>
								</Dialog>
							</Modal>
						</ModalOverlay>
					</DialogTrigger>
				</SettingsRow>
			</SettingsSection>
			<SettingsStatus tone={mutation.isSuccess ? 'success' : undefined}>
				{isOtherMutationPending ? 'Saving…' : mutation.isSuccess ? 'Saved settings cleared' : null}
			</SettingsStatus>
		</>
	);
}

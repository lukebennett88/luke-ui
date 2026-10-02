import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Heading } from '@luke-ui/react/heading';
import { Icon } from '@luke-ui/react/icon';
import { Prose } from '@luke-ui/react/prose';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { rootClassName } from '@luke-ui/react/theme';
import { cx } from '@luke-ui/react/utils';
import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';
import { useId, useRef, useState } from 'react';
import type { SubmitEvent } from 'react';
import { Button as RacButton } from 'react-aria-components/Button';
import { Dialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Modal, ModalOverlay } from 'react-aria-components/Modal';
import { profileSchema } from '../api/schemas.js';
import { settingsApi, settingsMutationErrorMessage } from '../api/settings-api.js';
import { settingsQueryKey } from '../api/settings-query.js';
import * as styles from '../styles/settings.css.js';

const EMAIL_MUTATION_KEY = [...settingsQueryKey, 'profile-field', 'email'] as const;

export function ChangeEmailDialog({ email }: { email: string }) {
	const queryClient = useQueryClient();
	const descriptionId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [draft, setDraft] = useState('');
	const [validationError, setValidationError] = useState<string>();
	const mutation = useMutation({
		mutationKey: EMAIL_MUTATION_KEY,
		mutationFn: (patch: { email: string }) => settingsApi.updateProfile(patch),
		onError: () => inputRef.current?.focus(),
		onSuccess: (settings) => {
			queryClient.setQueryData(settingsQueryKey, settings);
			setIsOpen(false);
		},
	});
	const isSaving = useIsMutating({ exact: true, mutationKey: EMAIL_MUTATION_KEY }) > 0;
	const errorMessage = validationError ?? settingsMutationErrorMessage(mutation.error, 'email');

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen && isSaving) return;
		if (nextOpen) {
			setDraft('');
			setValidationError(undefined);
			mutation.reset();
		}
		setIsOpen(nextOpen);
	}

	function save(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (isSaving) return;
		if (draft.trim() === email) {
			setValidationError('Enter a different email address');
			inputRef.current?.focus();
			return;
		}
		const parsed = profileSchema.shape.email.safeParse(draft.trim());
		if (!parsed.success) {
			setValidationError(parsed.error.issues[0]?.message);
			inputRef.current?.focus();
			return;
		}
		setValidationError(undefined);
		mutation.reset();
		mutation.mutate({ email: parsed.data });
	}

	return (
		<DialogTrigger isOpen={isOpen} onOpenChange={handleOpenChange}>
			<RacButton aria-label="Change email" className={styles.emailEditButton}>
				<Icon aria-hidden="true" name="edit" size="xsmall" />
			</RacButton>
			<ModalOverlay
				className={cx(rootClassName, styles.dialogOverlay)}
				isDismissable={!isSaving}
				isKeyboardDismissDisabled={isSaving}
			>
				<Modal className={styles.dialogModal}>
					<Dialog
						aria-describedby={descriptionId}
						aria-label="Change email"
						className={styles.dialog}
					>
						<form onSubmit={save}>
							<Stack gap="sp16">
								<Heading level={2} shouldDisableTrim typography="heading3">
									Change email
								</Heading>
								<Prose id={descriptionId}>
									<Text color="secondary" elementType="p">
										If you’d like to change the email address for your account, we’ll send a
										verification link to your new email address. This change will apply across all
										workspaces that you are a member of.
									</Text>
									<Text color="secondary" elementType="p">
										Please check if the new email address is tied to an existing account before
										proceeding with the change.
									</Text>
									<Text color="primary" fontWeight="label" elementType="p">
										Enter the new email address you’d like to use.
									</Text>
								</Prose>
								<TextInputField
									aria-label="New email address"
									errorMessage={errorMessage ? <span role="alert">{errorMessage}</span> : undefined}
									inputRef={inputRef}
									isReadOnly={isSaving}
									name="email"
									onChange={(nextDraft) => {
										if (isSaving) return;
										setDraft(nextDraft);
										setValidationError(undefined);
										mutation.reset();
									}}
									placeholder="New email address"
									size="small"
									validationBehavior="aria"
									value={draft}
								/>
								<Stack gap={isSaving ? 'sp8' : '0'}>
									<Text
										color="secondary"
										elementType="p"
										fontWeight="body"
										role="status"
										shouldDisableTrim
										typography="label"
									>
										{isSaving ? 'Saving…' : null}
									</Text>
									<Cluster gap="sp8" justifyContent="flex-end">
										<Button
											isDisabled={isSaving}
											type="button"
											onPress={() => handleOpenChange(false)}
											prominence="low"
										>
											Cancel
										</Button>
										<Button isPending={isSaving} type="submit" prominence="high">
											Check for existing account
										</Button>
									</Cluster>
								</Stack>
							</Stack>
						</form>
					</Dialog>
				</Modal>
			</ModalOverlay>
		</DialogTrigger>
	);
}

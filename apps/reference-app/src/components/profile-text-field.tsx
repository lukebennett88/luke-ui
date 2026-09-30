import { FieldDescription, FieldError, FieldLabel } from '@luke-ui/react/primitives/field';
import { InputGroup, InputGroupInput } from '@luke-ui/react/primitives/input-group';
import { Stack } from '@luke-ui/react/stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { TextField as RacTextField } from 'react-aria-components/TextField';
import type { ProfileUpdate } from '../api/schemas.js';
import { profileSchema } from '../api/schemas.js';
import { settingsApi } from '../api/settings-api.js';
import {
	isSettingsMutationPending,
	settingsMutationErrorMessage,
} from '../api/settings-mutation.js';
import { settingsQueryKey, updateSettingsCache } from '../api/settings-query.js';
import * as styles from '../styles/settings.css.js';
import { SettingsRowControl, SettingsRowShell } from './settings-section.js';

type ProfileField = 'displayName' | 'title' | 'username';

export function ProfileTextField({
	field,
	hint,
	label,
	placeholder,
	value,
}: {
	field: ProfileField;
	hint?: string;
	label: string;
	placeholder?: string;
	value: string;
}) {
	const queryClient = useQueryClient();
	const [draft, setDraft] = useState<string>();
	const [validationError, setValidationError] = useState<string>();
	const mutationKey = [...settingsQueryKey, 'profile-field', field] as const;
	const mutation = useMutation({
		mutationKey,
		mutationFn: (patch: ProfileUpdate) => settingsApi.updateProfile(patch),
		onSuccess: (settings) => {
			updateSettingsCache(queryClient, settings);
			setDraft(undefined);
		},
	});
	const isPending = () => isSettingsMutationPending(queryClient, mutation.isPending, mutationKey);
	const errorMessage = validationError ?? settingsMutationErrorMessage(mutation.error, field);

	function revert() {
		if (isPending()) return;
		setDraft(undefined);
		setValidationError(undefined);
		mutation.reset();
	}

	function commit() {
		if (isPending()) return;
		const nextDraft = draft ?? value;
		if (nextDraft === value) {
			setValidationError(undefined);
			mutation.reset();
			return;
		}
		const parsed = profileSchema.shape[field].safeParse(nextDraft);
		if (!parsed.success) {
			setValidationError(parsed.error.issues[0]?.message);
			return;
		}
		setValidationError(undefined);
		mutation.reset();
		mutation.mutate({ [field]: parsed.data });
	}

	return (
		<SettingsRowShell>
			<RacTextField
				className={styles.profileFieldShell}
				isInvalid={Boolean(errorMessage)}
				isReadOnly={isPending()}
				name={field}
				onBlur={commit}
				onChange={(nextDraft) => {
					if (isPending()) return;
					setDraft(nextDraft);
					setValidationError(undefined);
					mutation.reset();
				}}
				validationBehavior="aria"
				value={draft ?? value}
			>
				<Stack flexGrow="1" gap="sp4" minInlineSize="0">
					<FieldLabel>{label}</FieldLabel>
					{hint ? <FieldDescription>{hint}</FieldDescription> : null}
				</Stack>
				<SettingsRowControl>
					<Stack alignItems="flex-end" gap="sp4" minInlineSize="0">
						<InputGroup className={styles.profileTextField} size="small">
							<InputGroupInput
								onKeyDown={(event) => {
									if (event.key === 'Escape') {
										event.preventDefault();
										revert();
										return;
									}
									if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
									event.preventDefault();
									commit();
								}}
								placeholder={placeholder}
							/>
						</InputGroup>
						<FieldError>
							{errorMessage ? <span role="alert">{errorMessage}</span> : null}
						</FieldError>
					</Stack>
				</SettingsRowControl>
			</RacTextField>
		</SettingsRowShell>
	);
}

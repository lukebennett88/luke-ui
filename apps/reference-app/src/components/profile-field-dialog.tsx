import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Heading } from '@luke-ui/react/heading';
import { Text } from '@luke-ui/react/text';
import { TextField } from '@luke-ui/react/text-field';
import { rootClassName } from '@luke-ui/react/theme';
import { cx } from '@luke-ui/react/utils';
import { useState } from 'react';
import { Button as RacButton } from 'react-aria-components/Button';
import { Dialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Modal, ModalOverlay } from 'react-aria-components/Modal';
import * as styles from '../styles/settings.css.js';

export function ProfileFieldDialog({
	hint,
	label,
	onSave,
	placeholder,
	validate,
	value,
}: {
	hint?: string;
	label: string;
	onSave: (value: string) => void;
	placeholder?: string;
	validate: (value: string) => string | undefined;
	value: string;
}) {
	const displayValue = value.trim().length > 0 ? value : (placeholder ?? '—');
	const isPlaceholder = value.trim().length === 0;

	return (
		<DialogTrigger>
			<RacButton
				aria-label={`Edit ${label.toLowerCase()}`}
				className={styles.valueButton}
				data-placeholder={isPlaceholder || undefined}
			>
				{displayValue}
			</RacButton>
			<ModalOverlay className={cx(rootClassName, styles.dialogOverlay)} isDismissable>
				<Modal className={styles.dialogModal}>
					<Dialog aria-label={label} className={styles.dialog}>
						{({ close }) => (
							<ProfileFieldDialogForm
								close={close}
								hint={hint}
								label={label}
								onSave={onSave}
								placeholder={placeholder}
								validate={validate}
								value={value}
							/>
						)}
					</Dialog>
				</Modal>
			</ModalOverlay>
		</DialogTrigger>
	);
}

function ProfileFieldDialogForm({
	close,
	hint,
	label,
	onSave,
	placeholder,
	validate,
	value,
}: {
	close: () => void;
	hint?: string;
	label: string;
	onSave: (value: string) => void;
	placeholder?: string;
	validate: (value: string) => string | undefined;
	value: string;
}) {
	const [draft, setDraft] = useState(value);
	const [error, setError] = useState<string | undefined>();

	function submit() {
		const nextError = validate(draft);
		if (nextError) {
			setError(nextError);
			return;
		}
		onSave(draft);
		close();
	}

	return (
		<>
			<Heading level={2} shouldDisableTrim>
				{label}
			</Heading>
			{hint ? (
				<Text color="secondary" elementType="p" typography="caption">
					{hint}
				</Text>
			) : null}
			<TextField
				aria-label={label}
				errorMessage={error}
				onChange={(next) => {
					setDraft(next);
					setError(undefined);
				}}
				placeholder={placeholder}
				size="small"
				value={draft}
			/>
			<Cluster gap="sp8" justifyContent="flex-end">
				<Button onPress={close} prominence="low" type="button">
					Cancel
				</Button>
				<Button onPress={submit} prominence="high" type="button">
					Save
				</Button>
			</Cluster>
		</>
	);
}

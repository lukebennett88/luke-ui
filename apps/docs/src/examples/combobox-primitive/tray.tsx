import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import {
	ComboboxClearButton,
	ComboboxInput,
	ComboboxInputGroup,
	ComboboxItem,
	ComboboxListBox,
	ComboboxRoot,
	ComboboxTray,
	ComboboxTrayTrigger,
} from '@luke-ui/react/primitives/combobox';
import { Field } from '@luke-ui/react/primitives/field';
import type { SubmitEvent } from 'react';

const countries = [
	{ id: 'australia', label: 'Australia' },
	{ id: 'new-zealand', label: 'New Zealand' },
];

export default () => {
	function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
	}

	return (
		<form onSubmit={handleSubmit}>
			<Box display="flex" flexDirection="column" gap="sp16" maxInlineSize="20rem">
				<ComboboxRoot defaultItems={countries} isRequired name="country">
					<Field label="Country">
						<ComboboxInputGroup>
							<ComboboxTrayTrigger placeholder="Select a country...">
								<Icon name="chevronDown" />
							</ComboboxTrayTrigger>
						</ComboboxInputGroup>
						<ComboboxTray>
							<ComboboxInputGroup>
								<ComboboxInput placeholder="Select a country..." />
								<ComboboxClearButton aria-label="Clear search">
									<Icon name="close" />
								</ComboboxClearButton>
							</ComboboxInputGroup>
							<ComboboxListBox<{ id: string; label: string }>>
								{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
							</ComboboxListBox>
						</ComboboxTray>
					</Field>
				</ComboboxRoot>
				<Box>
					<Button type="submit">Create account</Button>
				</Box>
			</Box>
		</form>
	);
};

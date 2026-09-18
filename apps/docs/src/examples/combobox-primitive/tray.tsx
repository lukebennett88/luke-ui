import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
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
import { Stack } from '@luke-ui/react/stack';
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
			<Stack gap="sp16" maxInlineSize="20rem" inlineSize="100%">
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
				<Cluster>
					<Button type="submit">Create account</Button>
				</Cluster>
			</Stack>
		</form>
	);
};

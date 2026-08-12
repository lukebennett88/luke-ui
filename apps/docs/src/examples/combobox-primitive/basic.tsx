import { Icon } from '@luke-ui/react/icon';
import {
	ComboboxInput,
	ComboboxInputGroup,
	ComboboxItem,
	ComboboxListBox,
	ComboboxPopover,
	ComboboxRoot,
	ComboboxTrigger,
} from '@luke-ui/react/primitives/combobox';

export default () => {
	return (
		<ComboboxRoot aria-label="Country">
			<ComboboxInputGroup>
				<ComboboxInput />
				<ComboboxTrigger aria-label="Toggle options">
					<Icon name="chevronDown" />
				</ComboboxTrigger>
			</ComboboxInputGroup>
			<ComboboxPopover>
				<ComboboxListBox>
					<ComboboxItem id="au">Australia</ComboboxItem>
					<ComboboxItem id="nz">New Zealand</ComboboxItem>
				</ComboboxListBox>
			</ComboboxPopover>
		</ComboboxRoot>
	);
};

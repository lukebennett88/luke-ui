import {
	ComboboxInput,
	ComboboxInputGroup,
	ComboboxItem,
	ComboboxListBox,
	ComboboxPopover,
	ComboboxRoot,
	ComboboxTrigger,
} from '@luke-ui/react/combobox-field/primitive';

export default () => {
	return (
		<ComboboxRoot aria-label="Country">
			<ComboboxInputGroup>
				<ComboboxInput />
				<ComboboxTrigger aria-label="Toggle options" />
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

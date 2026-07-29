import {
	ComboboxControl,
	ComboboxItem,
	ComboboxListBox,
	ComboboxPopover,
	ComboboxRoot,
	ComboboxTextInput,
	ComboboxTrigger,
} from '@luke-ui/react/combobox-field/primitive';

export default function Basic() {
	return (
		<ComboboxRoot aria-label="Country">
			<ComboboxControl>
				<ComboboxTextInput />
				<ComboboxTrigger aria-label="Toggle options" />
			</ComboboxControl>
			<ComboboxPopover>
				<ComboboxListBox>
					<ComboboxItem id="au">Australia</ComboboxItem>
					<ComboboxItem id="nz">New Zealand</ComboboxItem>
				</ComboboxListBox>
			</ComboboxPopover>
		</ComboboxRoot>
	);
}

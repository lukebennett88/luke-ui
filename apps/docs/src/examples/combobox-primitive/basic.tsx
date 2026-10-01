import { Icon } from '@luke-ui/react/icon';
import {
	ComboboxControl,
	ComboboxInput,
	ComboboxItem,
	ComboboxListBox,
	ComboboxPopover,
	ComboboxRoot,
	ComboboxTrigger,
} from '@luke-ui/react/primitives/combobox';

export default () => {
	return (
		<ComboboxRoot aria-label="Country">
			<ComboboxControl>
				<ComboboxInput />
				<ComboboxTrigger aria-label="Toggle options">
					<Icon name="chevronDown" />
				</ComboboxTrigger>
			</ComboboxControl>
			<ComboboxPopover>
				<ComboboxListBox>
					<ComboboxItem id="au">Australia</ComboboxItem>
					<ComboboxItem id="nz">New Zealand</ComboboxItem>
				</ComboboxListBox>
			</ComboboxPopover>
		</ComboboxRoot>
	);
};

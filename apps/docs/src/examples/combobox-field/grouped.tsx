import { ComboboxField } from '@luke-ui/react/combobox-field';
import { ComboboxItem, ComboboxSection } from '@luke-ui/react/combobox-field/primitive';

export default function Grouped() {
	return (
		<ComboboxField label="Country" name="country">
			<ComboboxSection title="Northern hemisphere">
				<ComboboxItem id="ca">Canada</ComboboxItem>
			</ComboboxSection>
			<ComboboxSection title="Southern hemisphere">
				<ComboboxItem id="au">Australia</ComboboxItem>
			</ComboboxSection>
		</ComboboxField>
	);
}

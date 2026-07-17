import { ComboboxField } from '@luke-ui/react/combobox-field';
import { ComboboxItem, ComboboxSection } from '@luke-ui/react/combobox-field/primitive';

export default function Grouped() {
	return (
		<ComboboxField defaultValue="apple" label="Produce" name="produce" placeholder="Choose produce">
			<ComboboxSection title="Fruit">
				<ComboboxItem id="apple">Apple</ComboboxItem>
				<ComboboxItem id="orange">Orange</ComboboxItem>
			</ComboboxSection>
			<ComboboxSection title="Vegetables">
				<ComboboxItem id="carrot">Carrot</ComboboxItem>
				<ComboboxItem id="potato">Potato</ComboboxItem>
			</ComboboxSection>
		</ComboboxField>
	);
}

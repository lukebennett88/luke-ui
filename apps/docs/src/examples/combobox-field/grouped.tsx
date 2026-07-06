import { ComboboxField } from '@luke-ui/react/combobox-field';
import { ComboboxItem, ComboboxSection } from '@luke-ui/react/combobox-field/primitive';
import type { JSX } from 'react';

export default function Grouped(): JSX.Element {
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

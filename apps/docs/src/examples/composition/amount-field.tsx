import { Field } from '@luke-ui/react/field/primitive';
import { TextInput } from '@luke-ui/react/text-field/primitive';

export default function AmountField() {
	return (
		<Field description="Enter an amount in dollars." label="Amount">
			<TextInput adornmentStart="$" inputMode="decimal" name="amount" placeholder="0.00" />
		</Field>
	);
}

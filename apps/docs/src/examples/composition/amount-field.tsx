import { Field } from '@luke-ui/react/primitives/field';
import {
	TextInput,
	TextInputControl,
	TextInputPrefix,
	TextInputRoot,
} from '@luke-ui/react/primitives/text-input';

export default () => {
	return (
		<TextInputRoot name="amount">
			<Field description="Enter an amount in dollars." label="Amount">
				<TextInputControl>
					<TextInputPrefix>$</TextInputPrefix>
					<TextInput inputMode="decimal" placeholder="0.00" />
				</TextInputControl>
			</Field>
		</TextInputRoot>
	);
};

import { Field } from '@luke-ui/react/primitives/field';
import {
	InputGroup,
	InputGroupInput,
	InputGroupPrefix,
} from '@luke-ui/react/primitives/input-group';

export default () => {
	return (
		<Field description="Enter an amount in dollars." label="Amount">
			<InputGroup>
				<InputGroupPrefix>$</InputGroupPrefix>
				<InputGroupInput inputMode="decimal" name="amount" placeholder="0.00" />
			</InputGroup>
		</Field>
	);
};

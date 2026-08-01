import { Field } from '@luke-ui/react/field/primitive';
import { InputGroup, InputGroupInput } from '@luke-ui/react/text-field/primitive';

export default function Basic() {
	return (
		<Field description="Use your work email." label="Email">
			<InputGroup>
				<InputGroupInput name="email" type="email" />
			</InputGroup>
		</Field>
	);
}

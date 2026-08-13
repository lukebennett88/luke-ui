import { Field, FieldDescription, FieldLabel } from '@luke-ui/react/primitives/field';
import { InputGroup, InputGroupInput } from '@luke-ui/react/primitives/input-group';

export default () => {
	return (
		<Field>
			<FieldLabel htmlFor="work-email">Email</FieldLabel>
			<InputGroup>
				<InputGroupInput
					aria-describedby="work-email-description"
					id="work-email"
					name="email"
					type="email"
				/>
			</InputGroup>
			<FieldDescription id="work-email-description">Use your work email.</FieldDescription>
		</Field>
	);
};

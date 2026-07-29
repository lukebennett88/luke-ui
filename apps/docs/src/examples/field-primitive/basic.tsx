import { Field } from '@luke-ui/react/field/primitive';
import { TextInput } from '@luke-ui/react/text-field/primitive';

export default function Basic() {
	return (
		<Field description="Use your work email." label="Email">
			<TextInput name="email" type="email" />
		</Field>
	);
}

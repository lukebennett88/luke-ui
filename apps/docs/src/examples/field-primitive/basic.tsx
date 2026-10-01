import { Field } from '@luke-ui/react/primitives/field';
import { TextInput, TextInputRoot } from '@luke-ui/react/primitives/text-input';

export default () => {
	return (
		<TextInputRoot name="email" type="email">
			<Field description="Use your work email." label="Email">
				<TextInput />
			</Field>
		</TextInputRoot>
	);
};

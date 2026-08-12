import {
	Checkbox,
	CheckboxContent,
	CheckboxControl,
	CheckboxIndicator,
} from '@luke-ui/react/primitives/checkbox';
import { FieldDescription, FieldError } from '@luke-ui/react/primitives/field';

export default () => {
	return (
		<Checkbox isInvalid>
			<CheckboxContent>
				<CheckboxControl>
					<CheckboxIndicator />
				</CheckboxControl>
				Email notifications
			</CheckboxContent>
			<FieldDescription>Receive updates by email.</FieldDescription>
			<FieldError>Choose an option.</FieldError>
		</Checkbox>
	);
};

import {
	Checkbox,
	CheckboxContent,
	CheckboxControl,
	CheckboxIndicator,
} from '@luke-ui/react/checkbox/primitive';
import { FieldDescription, FieldError } from '@luke-ui/react/field/primitive';

export default function Basic() {
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
}

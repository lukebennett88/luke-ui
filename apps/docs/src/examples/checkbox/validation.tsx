import { Checkbox } from '@luke-ui/react/checkbox';

export default function Validation() {
	return (
		<Checkbox
			description="We record the date you accepted."
			errorMessage="Accept the terms of service before you continue."
			isInvalid
			isRequired
		>
			I accept the terms of service
		</Checkbox>
	);
}

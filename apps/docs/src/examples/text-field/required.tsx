import { TextField } from '@luke-ui/react/text-field';

export default function Required() {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxInlineSize: '20rem' }}>
			<TextField isRequired label="First name" name="firstName" necessityIndicator="icon" />
			<TextField isRequired label="Last name" name="lastName" necessityIndicator="label" />
		</div>
	);
}

import {
	InputGroup,
	InputGroupInput,
	InputGroupPrefix,
	InputGroupSuffix,
} from '@luke-ui/react/text-field/primitive';

export default () => {
	return (
		<InputGroup>
			<InputGroupPrefix>$</InputGroupPrefix>
			<InputGroupInput aria-label="Amount" inputMode="decimal" placeholder="0.00" />
			<InputGroupSuffix>USD</InputGroupSuffix>
		</InputGroup>
	);
};

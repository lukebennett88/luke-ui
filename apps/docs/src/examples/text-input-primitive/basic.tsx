import {
	TextInput,
	TextInputControl,
	TextInputPrefix,
	TextInputSuffix,
} from '@luke-ui/react/primitives/text-input';

export default () => {
	return (
		<TextInputControl>
			<TextInputPrefix>$</TextInputPrefix>
			<TextInput aria-label="Amount" inputMode="decimal" placeholder="0.00" />
			<TextInputSuffix>USD</TextInputSuffix>
		</TextInputControl>
	);
};

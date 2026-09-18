import { Numeral } from '@luke-ui/react/numeral';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Stack gap="sp8">
			<Text>
				Short: <Numeral abbreviate value={12_345} />
			</Text>
			<Text>
				Long: <Numeral abbreviate="long" value={12_345} />
			</Text>
		</Stack>
	);
};

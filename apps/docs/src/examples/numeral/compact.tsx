import { Box } from '@luke-ui/react/box';
import { Numeral } from '@luke-ui/react/numeral';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box display="flex" flexDirection="column" gap="sp8">
			<Text>
				Short: <Numeral abbreviate value={12_345} />
			</Text>
			<Text>
				Long: <Numeral abbreviate="long" value={12_345} />
			</Text>
		</Box>
	);
};

import { Box } from '@luke-ui/react/box';
import { Numeral } from '@luke-ui/react/numeral';
import { Text } from '@luke-ui/react/text';

export default function Basic() {
	return (
		<Box display="flex" flexDirection="column" gap="100">
			<Text color="secondary" size="200">
				Active users
			</Text>
			<Numeral size="500" value={12_345.67} />
		</Box>
	);
}

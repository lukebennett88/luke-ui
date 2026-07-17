import { Box } from '@luke-ui/react/box';
import { Numeral } from '@luke-ui/react/numeral';
import { Text } from '@luke-ui/react/text';

export default function Precision() {
	return (
		<Box display="flex" flexDirection="column" gap="200">
			<Text>
				Fixed: <Numeral precision={2} value={98.7654} />
			</Text>
			<Text>
				Range: <Numeral precision={[0, 2]} value={1_234.5678} />
			</Text>
		</Box>
	);
}

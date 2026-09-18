import { Numeral } from '@luke-ui/react/numeral';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Stack gap="sp8">
			<Text>
				Fixed: <Numeral precision={2} value={98.7654} />
			</Text>
			<Text>
				Range: <Numeral precision={[0, 2]} value={1_234.5678} />
			</Text>
		</Stack>
	);
};

import { Box } from '@luke-ui/react/box';
import { Numeral } from '@luke-ui/react/numeral';
import { Text } from '@luke-ui/react/text';

export default function Formats() {
	return (
		<Box display="flex" flexDirection="column" gap="200">
			<Text>
				Conversion rate: <Numeral format="percent" value={0.125} />
			</Text>
			<Text>
				Monthly spend: <Numeral currency="AUD" value={98.76} />
			</Text>
			<Text>
				Wind speed: <Numeral unit="kilometer-per-hour" value={98} />
			</Text>
			<Text>
				Page views: <Numeral format="decimal" value={12_345} />
			</Text>
		</Box>
	);
}

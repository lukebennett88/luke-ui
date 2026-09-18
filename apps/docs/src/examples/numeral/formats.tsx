import { Numeral } from '@luke-ui/react/numeral';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Stack gap="sp8">
			<Text>
				Conversion rate: <Numeral format="percent" value={0.125} />
			</Text>
			<Text>
				Ticket price: <Numeral currency="AUD" value={98.76} />
			</Text>
			<Text>
				Wind speed: <Numeral unit="kilometer-per-hour" value={98} />
			</Text>
			<Text>
				Page views: <Numeral format="decimal" value={12_345} />
			</Text>
		</Stack>
	);
};

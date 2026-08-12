import { Emoji } from '@luke-ui/react/emoji';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Text>
			Status: <Emoji emoji="✅" label="Complete" />
		</Text>
	);
};

import { Code } from '@luke-ui/react/code';
import { Text } from '@luke-ui/react/text';

export default function InContext() {
	return (
		<Text>
			Use the <Code>useTheme</Code> hook to access the current theme. The <Code>theme</Code> prop
			supports <Code>"light"</Code>, <Code>"dark"</Code>, and <Code>"system"</Code>.
		</Text>
	);
}

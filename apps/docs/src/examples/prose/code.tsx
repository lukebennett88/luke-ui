import { Code } from '@luke-ui/react/code';
import { Prose } from '@luke-ui/react/prose';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Prose style={{ maxInlineSize: '18rem' }}>
			<Text elementType="p">
				Use <Code>Code</Code> for a short inline fragment.
			</Text>
			<pre tabIndex={0}>
				<code>
					{
						'<Prose>\n  <Heading level={2}>A heading</Heading>\n  <Text elementType="p">A paragraph in the document.</Text>\n</Prose>'
					}
				</code>
			</pre>
		</Prose>
	);
};

import { Box } from '@luke-ui/react/box';
import { Code } from '@luke-ui/react/code';
import { Prose } from '@luke-ui/react/prose';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box
			borderColor="decorative"
			borderRadius="detail"
			borderStyle="solid"
			borderWidth="thin"
			maxInlineSize="18rem"
			padding="sp12"
		>
			<Prose>
				<Text elementType="p">Import each component from its own entry point.</Text>
				<pre tabIndex={0}>
					<code>{`import { Prose } from '@luke-ui/react/prose';`}</code>
				</pre>
				<table tabIndex={0}>
					<thead>
						<tr>
							<th scope="col">Entry point</th>
							<th scope="col">Exports</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>
								<Code>@luke-ui/react/heading</Code>
							</td>
							<td>
								<Code>Heading</Code>, <Code>HeadingProps</Code>
							</td>
						</tr>
						<tr>
							<td>
								<Code>@luke-ui/react/prose</Code>
							</td>
							<td>
								<Code>Prose</Code>, <Code>ProseProps</Code>
							</td>
						</tr>
					</tbody>
				</table>
			</Prose>
		</Box>
	);
};

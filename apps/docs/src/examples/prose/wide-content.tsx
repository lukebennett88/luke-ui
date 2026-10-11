import { Code } from '@luke-ui/react/code';
import { Prose } from '@luke-ui/react/prose';
import { ScrollFade } from '@luke-ui/react/scroll-fade';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Prose style={{ maxInlineSize: '18rem' }}>
			<Text elementType="p">Import each component from its own entry point.</Text>
			<pre tabIndex={0}>
				<code>{`import { ScrollFade } from '@luke-ui/react/scroll-fade';`}</code>
			</pre>
			<ScrollFade aria-label="Entry points" marginBlockStart="sp40">
				<table>
					<thead>
						<tr>
							<th scope="col">Entry point</th>
							<th scope="col">Exports</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>
								<Code>@luke-ui/react/prose</Code>
							</td>
							<td>
								<Code>Prose</Code>, <Code>ProseProps</Code>
							</td>
						</tr>
						<tr>
							<td>
								<Code>@luke-ui/react/scroll-fade</Code>
							</td>
							<td>
								<Code>ScrollFade</Code>, <Code>ScrollFadeProps</Code>
							</td>
						</tr>
					</tbody>
				</table>
			</ScrollFade>
		</Prose>
	);
};

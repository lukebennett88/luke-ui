import { Code } from '@luke-ui/react/code';
import { Heading } from '@luke-ui/react/heading';
import { Prose } from '@luke-ui/react/prose';
import { ScrollFade } from '@luke-ui/react/scroll-fade';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Prose style={{ inlineSize: '18rem', maxInlineSize: '100%' }}>
			<Heading level={3}>Token reference</Heading>
			<Text elementType="p">
				Compare steps when choosing a token for layout gaps between related blocks.
			</Text>
			<ScrollFade aria-label="Spacing token reference" marginBlockStart="sp40">
				<table>
					<thead>
						<tr>
							<th scope="col">Token</th>
							<th scope="col">Value</th>
							<th scope="col">Typical use</th>
							<th scope="col">Custom property</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>
								<Code>sp8</Code>
							</td>
							<td>8px</td>
							<td>Tight gaps inside a control</td>
							<td>
								<Code>var(--luke-space-sp8)</Code>
							</td>
						</tr>
						<tr>
							<td>
								<Code>sp16</Code>
							</td>
							<td>16px</td>
							<td>Padding inside a compact card</td>
							<td>
								<Code>var(--luke-space-sp16)</Code>
							</td>
						</tr>
						<tr>
							<td>
								<Code>sp24</Code>
							</td>
							<td>24px</td>
							<td>Space after a tertiary heading</td>
							<td>
								<Code>var(--luke-space-sp24)</Code>
							</td>
						</tr>
						<tr>
							<td>
								<Code>sp40</Code>
							</td>
							<td>40px</td>
							<td>Space before a table or figure</td>
							<td>
								<Code>var(--luke-space-sp40)</Code>
							</td>
						</tr>
					</tbody>
				</table>
			</ScrollFade>
		</Prose>
	);
};

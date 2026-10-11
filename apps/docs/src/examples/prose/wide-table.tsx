import { Code } from '@luke-ui/react/code';
import { Prose } from '@luke-ui/react/prose';
import { ScrollFade } from '@luke-ui/react/scroll-fade';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Prose style={{ maxInlineSize: '18rem' }}>
			<Text elementType="p">Scroll horizontally to see every column.</Text>
			<ScrollFade aria-label="Spacing token values" marginBlockStart="sp40">
				<table>
					<thead>
						<tr>
							<th scope="col">Token</th>
							<th scope="col">Value</th>
							<th scope="col">CSS custom property</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<th scope="row">
								<Code>sp8</Code>
							</th>
							<td>8px</td>
							<td>
								<Code>var(--luke-space-sp8)</Code>
							</td>
						</tr>
						<tr>
							<th scope="row">
								<Code>sp16</Code>
							</th>
							<td>16px</td>
							<td>
								<Code>var(--luke-space-sp16)</Code>
							</td>
						</tr>
						<tr>
							<th scope="row">
								<Code>sp24</Code>
							</th>
							<td>24px</td>
							<td>
								<Code>var(--luke-space-sp24)</Code>
							</td>
						</tr>
					</tbody>
				</table>
			</ScrollFade>
		</Prose>
	);
};

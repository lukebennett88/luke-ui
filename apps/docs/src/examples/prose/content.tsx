import { Code } from '@luke-ui/react/code';
import { Prose } from '@luke-ui/react/prose';
import { Text } from '@luke-ui/react/text';

const swatch =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='64'%3E%3Crect width='320' height='64' fill='%23888'/%3E%3C/svg%3E";

export default () => {
	return (
		<Prose style={{ inlineSize: '18rem', maxInlineSize: '100%' }}>
			<img alt="Grey sample swatch" height={64} src={swatch} width={320} />
			<Text elementType="pre" tabIndex={0}>
				<Code>{'padding-inline: var(--luke-space-sp16);'}</Code>
			</Text>
			<table>
				<thead>
					<tr>
						<th scope="col">Step</th>
						<th scope="col">Space</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Small</td>
						<td>8px</td>
					</tr>
					<tr>
						<td>Medium</td>
						<td>24px</td>
					</tr>
				</tbody>
				<tfoot>
					<tr>
						<td>Total steps</td>
						<td>2</td>
					</tr>
				</tfoot>
			</table>
		</Prose>
	);
};

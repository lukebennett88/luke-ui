import { Code } from '@luke-ui/react/code';
import { Heading } from '@luke-ui/react/heading';
import { Prose } from '@luke-ui/react/prose';
import { Text } from '@luke-ui/react/text';

const spacingDiagram =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='120' viewBox='0 0 320 120'%3E%3Cg font-family='ui-sans-serif%2Csystem-ui%2Csans-serif' font-size='11' fill='%2371717a'%3E%3Ctext x='16' y='28'%3Esp8%3C/text%3E%3Crect x='56' y='18' width='8' height='12' rx='2' fill='%2371717a'/%3E%3Ctext x='16' y='56'%3Esp16%3C/text%3E%3Crect x='56' y='46' width='16' height='12' rx='2' fill='%2371717a'/%3E%3Ctext x='16' y='84'%3Esp24%3C/text%3E%3Crect x='56' y='74' width='24' height='12' rx='2' fill='%2371717a'/%3E%3Ctext x='16' y='112'%3Esp32%3C/text%3E%3Crect x='56' y='102' width='32' height='12' rx='2' fill='%2371717a'/%3E%3C/g%3E%3C/svg%3E";

export default () => {
	return (
		<Prose style={{ inlineSize: '18rem', maxInlineSize: '100%' }}>
			<Heading level={3}>Spacing tokens</Heading>
			<Text elementType="p">
				Prefer a named step such as <Code>sp16</Code> over a raw pixel value when laying out
				long-form content.
			</Text>
			<figure>
				<img
					alt="Bars for spacing steps sp8, sp16, sp24, and sp32"
					height={120}
					src={spacingDiagram}
					width={320}
				/>
				<figcaption>
					<Text color="secondary" elementType="span" typography="caption">
						Each bar is drawn at the token's pixel width.
					</Text>
				</figcaption>
			</figure>
			{/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable pre */}
			<pre tabIndex={0}>
				<code>
					{'padding-inline: var(--luke-space-sp16); /* long declarations stay on one line */'}
				</code>
			</pre>
			<table>
				<thead>
					<tr>
						<th scope="col">Step</th>
						<th scope="col">Use for</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>
							<Code>sp8</Code>
						</td>
						<td>Tight gaps inside a control</td>
					</tr>
					<tr>
						<td>
							<Code>sp24</Code>
						</td>
						<td>Space after a heading</td>
					</tr>
				</tbody>
			</table>
		</Prose>
	);
};

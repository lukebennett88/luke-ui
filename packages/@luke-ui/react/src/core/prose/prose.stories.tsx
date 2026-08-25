import { Blockquote } from '@luke-ui/react/blockquote';
import { Code } from '@luke-ui/react/code';
import { Heading } from '@luke-ui/react/heading';
import { Prose } from '@luke-ui/react/prose';
import { Text } from '@luke-ui/react/text';
import preview from '../../../.storybook/preview.js';

const meta = preview.meta({
	component: Prose,
	tags: ['typography'],
	title: 'Typography/Prose',
});

const swatch =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='64'%3E%3Crect width='320' height='64' fill='%23888'/%3E%3C/svg%3E";

export const Default = meta.story({
	render: (props) => (
		<div style={{ maxInlineSize: '40rem' }}>
			<Prose {...props}>
				<Heading level={2}>Choosing a spacing scale</Heading>
				<Text elementType="p">
					A spacing scale trades range for consistency. Nine steps cover a component library without
					offering two values a designer cannot tell apart.
				</Text>
				<Text elementType="p">
					Every step below is a token. Reach for the nearest one rather than a raw pixel value.
				</Text>

				<Heading level={3}>Picking a step</Heading>
				<Text elementType="p">Work outwards from the tightest gap the layout needs.</Text>
				<ol>
					<li>Measure the smallest gap in the design.</li>
					<li>
						Round it to the nearest step.
						<ul>
							<li>Round down inside a control.</li>
							<li>Round up between sections.</li>
						</ul>
					</li>
					<li>Use that step everywhere the same relationship appears.</li>
				</ol>

				<Heading level={4}>Rounding in practice</Heading>
				<ul>
					<li>
						<Text elementType="p">A loose item holds more than one paragraph.</Text>
						<Text elementType="p">The second takes a tighter gap than a document paragraph.</Text>
					</li>
					<li>
						<Text elementType="p">Each item keeps the list rhythm.</Text>
					</li>
				</ul>
				<ol type="a">
					<li>An explicit list type keeps its own marker.</li>
					<li>The reset does not force it back to decimal.</li>
				</ol>

				<Blockquote>
					Perfect typography is certainly the most elusive of all arts. Sculpture in stone alone
					comes near it in obstinacy.
				</Blockquote>

				<Heading level={3}>Reading a token</Heading>
				<Text elementType="p">
					Each token resolves to a custom property, so a theme can restate the value without
					touching a component.
				</Text>
				<Text elementType="pre">
					<Code>{'padding-inline: var(--luke-space-sp16);'}</Code>
				</Text>
				<img alt="" height={64} src={swatch} width={320} />
				<picture>
					<img alt="" height={64} src={swatch} width={320} />
				</picture>
				<video aria-label="Spacing scale animation" height={64} muted poster={swatch} width={320} />

				<table>
					<caption>
						<Text elementType="span">Steps and their resolved values</Text>
					</caption>
					<thead>
						<tr>
							<th scope="col">Step</th>
							<th scope="col">Value</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>
								<Code>sp8</Code>
							</td>
							<td>8px</td>
						</tr>
						<tr>
							<td>
								<Code>sp16</Code>
							</td>
							<td>16px</td>
						</tr>
						<tr>
							<td>
								<Code>sp24</Code>
							</td>
							<td>24px</td>
						</tr>
					</tbody>
				</table>

				<hr />

				<Heading level={3}>Terms</Heading>
				<dl>
					<dt>
						<Text elementType="span" fontWeight="emphasis">
							Step
						</Text>
					</dt>
					<dd>
						<Text elementType="span">One named value on the scale.</Text>
					</dd>
					<dt>
						<Text elementType="span" fontWeight="emphasis">
							Gap
						</Text>
					</dt>
					<dd>
						<Text elementType="span">The measured distance between two boxes.</Text>
					</dd>
				</dl>

				<figure>
					<img alt="" height={64} src={swatch} width={320} />
					<figcaption>
						<Text color="secondary" elementType="span" typography="caption">
							Grouping changes with distance alone.
						</Text>
					</figcaption>
				</figure>
			</Prose>
		</div>
	),
});

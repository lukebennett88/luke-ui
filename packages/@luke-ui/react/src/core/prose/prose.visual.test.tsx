import { test } from 'vite-plus/test';
import { Blockquote } from '../blockquote/blockquote.js';
import { Code } from '../code/code.js';
import { Heading } from '../heading/heading.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance, Stack } from '../test-utils/visual.js';
import { Text } from '../text/text.js';
import { Prose } from './prose.js';

const swatch =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='64'%3E%3Crect width='320' height='64' fill='%23888'/%3E%3C/svg%3E";

const document = (
	<Prose>
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
		<ol type="1">
			<li>Decimal markers.</li>
		</ol>
		<ol type="a">
			<li>Lower-alpha markers.</li>
		</ol>
		<ol type="A">
			<li>Upper-alpha markers.</li>
		</ol>
		<ol type="i">
			<li>Lower-roman markers.</li>
		</ol>
		<ol type="I">
			<li>Upper-roman markers.</li>
		</ol>

		<Blockquote>
			Perfect typography is certainly the most elusive of all arts. Sculpture in stone alone comes
			near it in obstinacy.
		</Blockquote>

		<Heading level={4}>Reading a token</Heading>
		<Text elementType="pre">
			<Code>{'padding-inline: var(--luke-space-sp16);'}</Code>
		</Text>
		{/* A line past the frame: the block scrolls on its own rather than clipping. `tabIndex`
		 and a name keep that scroll container keyboard-reachable until #527 lands. */}
		<Text aria-label="Grid template columns example" elementType="pre" tabIndex={0}>
			<Code>
				{
					'grid-template-columns: [full-start] minmax(var(--luke-space-sp24), 1fr) [content-start] minmax(0, 60rem) [content-end] minmax(var(--luke-space-sp24), 1fr) [full-end];'
				}
			</Code>
		</Text>
		<img alt="" height={64} src={swatch} width={320} />
		<picture>
			<img alt="" height={64} src={swatch} width={320} />
		</picture>
		<video aria-label="Spacing scale animation" height={64} muted poster={swatch} width={320} />

		<table>
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
						<Code>sp24</Code>
					</td>
					<td>24px</td>
				</tr>
			</tbody>
		</table>

		{/* More columns than the frame holds: the table scrolls without widening the document. */}
		<table>
			<thead>
				<tr>
					{['Step', 'Value', 'Gap', 'Inset', 'Stack', 'Inline', 'Block', 'Gutter'].map((column) => (
						<th key={column} scope="col">
							{column}
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				<tr>
					{['sp8', '8px', '8px', '8px', '8px', '8px', '8px', '8px'].map((cell, index) => (
						<td key={index}>{cell}</td>
					))}
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
);

for (const appearance of visualAppearances) {
	test(`kitchen sink: ${appearance.theme} ${appearance.mode}`, async () => {
		const { locator } = render(<Stack width="40rem">{document}</Stack>, { appearance });

		await captureVisualAppearance(locator, 'prose/kitchen-sink', appearance);
	});
}

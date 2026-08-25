import { test } from 'vite-plus/test';
import { Blockquote } from '../blockquote/blockquote.js';
import { Code } from '../code/code.js';
import { Heading } from '../heading/heading.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance, Stack } from '../test-utils/visual.js';
import { Text } from '../text/text.js';
import { Prose } from './prose.js';

/**
 * `Prose` has no variants, so the kitchen sink is one long-form document covering every block
 * element it spaces. The four appearances stay in because the rule between sections takes its
 * colour from the theme.
 */
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

		<Blockquote>
			Perfect typography is certainly the most elusive of all arts. Sculpture in stone alone comes
			near it in obstinacy.
		</Blockquote>

		<Heading level={4}>Reading a token</Heading>
		<Text elementType="pre">
			<Code>{'padding-inline: var(--luke-space-sp16);'}</Code>
		</Text>

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
			<ul>
				<li>Four pixels apart reads as one group.</li>
				<li>Twenty-four pixels apart reads as two.</li>
			</ul>
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

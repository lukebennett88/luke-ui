import { Blockquote } from '@luke-ui/react/blockquote';
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
				<ul>
					<li>Measure the smallest gap in the design.</li>
					<li>Round it to the nearest step.</li>
					<li>Use that step everywhere the same relationship appears.</li>
				</ul>
				<Blockquote>
					Perfect typography is certainly the most elusive of all arts. Sculpture in stone alone
					comes near it in obstinacy.
				</Blockquote>
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

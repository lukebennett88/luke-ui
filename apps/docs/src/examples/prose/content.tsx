import { Code } from '@luke-ui/react/code';
import { Heading } from '@luke-ui/react/heading';
import { Prose } from '@luke-ui/react/prose';
import { Text } from '@luke-ui/react/text';

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
					alt="Calm lake with mountains in the distance"
					height={800}
					src="https://images.unsplash.com/photo-1479030160180-b1860951d696?auto=format&fit=crop&w=1200&q=80"
					width={1200}
				/>
				<figcaption>
					<Text color="secondary" elementType="span" typography="caption">
						Lake McDonald, Glacier National Park.
					</Text>
				</figcaption>
			</figure>
			{/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable pre */}
			<pre tabIndex={0}>
				<code>
					{'.card { padding-inline: var(--luke-space-sp16); margin-block: var(--luke-space-sp8); }'}
				</code>
			</pre>
		</Prose>
	);
};

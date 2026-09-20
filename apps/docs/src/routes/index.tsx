import { Code } from '@luke-ui/react/code';
import { Heading, HeadingLevels } from '@luke-ui/react/heading';
import { Prose } from '@luke-ui/react/prose';
import { Text } from '@luke-ui/react/text';
import { createFileRoute } from '@tanstack/react-router';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { SiteNav } from '../components/site-nav.js';

export const Route = createFileRoute('/')({
	component: Home,
	head: () => ({
		meta: [{ title: 'Luke UI' }],
	}),
});

function Home() {
	return (
		<>
			<SiteNav />
			<main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 md:px-6 md:py-24">
				<Prose>
					<HeadingLevels base={1}>
						<Heading>Luke UI</Heading>
						<Text elementType="p">
							Luke UI is a React design system built on React Aria Components. It ships static CSS,
							two bundled themes, and layout utilities that share a semantic token system.
						</Text>
						<Cards className="mt-6">
							<Card href="/docs/installation" title="Installation">
								Install Luke UI, apply a bundled theme, and render a component.
							</Card>
							<Card href="/components" title="Components">
								Browse the full component catalogue.
							</Card>
						</Cards>
						<HeadingLevels>
							<Heading>Features</Heading>
							<HeadingLevels>
								<Heading>Custom themes</Heading>
								<Text elementType="p">
									Luke UI ships with two themes. Use <Code>defineTheme</Code> to create your own
									from a small set of colour, typography, radius, and depth choices, or extend a
									bundled theme. Generated themes include light and dark modes and are
									contrast-validated.
								</Text>
								<Heading>Static CSS</Heading>
								<Text elementType="p">
									Styles ship as static CSS with no runtime styling layer. Applying a theme does not
									require a React provider.
								</Text>
								<Heading>Composition at every level</Heading>
								<Text elementType="p">
									Start with composed components, use exported primitives when you need more
									control, or use React Aria Components directly.
								</Text>
								<Heading>Built-in loading states</Heading>
								<Text elementType="p">
									Async button actions manage their own pending state. Skeletons and spinners
									preserve the footprint of the content they replace.
								</Text>
								<Heading>Flexible validation</Heading>
								<Text elementType="p">
									Use browser constraints, custom rules, controlled or server errors, or delegate
									validation to a form library.
								</Text>
								<Heading>Structured typography</Heading>
								<Text elementType="p">
									Text is trimmed to its visible bounds, while heading levels can follow component
									structure automatically.
								</Text>
							</HeadingLevels>
						</HeadingLevels>
					</HeadingLevels>
				</Prose>
			</main>
		</>
	);
}

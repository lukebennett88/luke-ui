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
						<Heading>Introduction</Heading>
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
							<Heading>Design system</Heading>
							<HeadingLevels>
								<Heading>Customisable themes</Heading>
								<Text elementType="p">
									Luke UI ships with two themes. Use <Code>defineTheme</Code> to create your own
									from a small set of colour, typography, radius, and depth choices, or extend a
									bundled theme. Generated themes include light and dark modes and are
									contrast-validated.
								</Text>
								<Heading>Static CSS</Heading>
								<Text elementType="p">
									Styles ship as static CSS with no runtime. Themes apply without a React provider.
								</Text>
								<Heading>Composed components and primitives</Heading>
								<Text elementType="p">
									Use composed components for common cases. For more control, use the exported
									primitives or React Aria Components directly.
								</Text>
								<Heading>Predictable text spacing</Heading>
								<Text elementType="p">
									Leading is trimmed so spacing sits between the visible letters.
								</Text>
								<Heading>Async buttons</Heading>
								<Text elementType="p">
									<Code>pressAction</Code> manages the pending state, so you do not need to track
									loading separately.
								</Text>
								<Heading>Loading without layout shift</Heading>
								<Text elementType="p">
									Skeleton and spinner match the size of the content they stand in for, so nothing
									shifts when it arrives.
								</Text>
							</HeadingLevels>
							<Heading>Documentation</Heading>
							<HeadingLevels>
								<Heading>Type-checked examples</Heading>
								<Text elementType="p">
									Rendered examples are type-checked against the current component API.
								</Text>
								<Heading>Live playground</Heading>
								<Text elementType="p">
									The playground provides autocomplete and type errors as you edit.
								</Text>
							</HeadingLevels>
						</HeadingLevels>
					</HeadingLevels>
				</Prose>
			</main>
		</>
	);
}

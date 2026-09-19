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
							two bundled themes with distinct visual identities, and layout utilities on a shared
							semantic token contract.
						</Text>
						<Cards className="mt-6">
							<Card href="/docs/installation" title="Installation">
								Install Luke UI, apply a bundled theme, and render a component.
							</Card>
							<Card href="/components" title="Components">
								Browse Components for the full catalogue
							</Card>
						</Cards>
						<HeadingLevels>
							<Heading>Core values</Heading>
							<HeadingLevels>
								<Heading>Themes with distinct identities</Heading>
								<Text elementType="p">
									Not accent-colour swapping. <Code>paper</Code> and <Code>tactile</Code> are
									different visual identities built from the same components, with tonal ramps
									derived in Oklch and contrast validated rather than eyeballed.
								</Text>
								<Heading>Static CSS</Heading>
								<Text elementType="p">
									Vanilla Extract, no runtime. Themes apply via <Code>:where(:root)</Code> and an
									identity class, so there is no provider to mount and portals inherit.
								</Text>
								<Heading>Composed components and primitives</Heading>
								<Text elementType="p">
									Composed components for the common case, the primitives they are built from
									exported alongside them, and React Aria Components as a peer dependency to drop
									down another level.
								</Text>
								<Heading>Text sits where you put it</Heading>
								<Text elementType="p">
									Capsize trims the leading so spacing is between the visible letters. Headings take
									their level from context instead of being hand-numbered.
								</Text>
							</HeadingLevels>
							<Heading>Design decisions</Heading>
							<HeadingLevels>
								<Heading>Async buttons</Heading>
								<Text elementType="p">
									<Code>pressAction</Code> owns the pending state, so consumers do not track loading
									themselves.
								</Text>
								<Heading>Loading placeholders that shrink-wrap</Heading>
								<Text elementType="p">
									Skeleton and spinner take the size of the content they stand in for, so nothing
									shifts when it arrives.
								</Text>
								<Heading>Examples that cannot drift</Heading>
								<Text elementType="p">
									Every docs example is type-checked TypeScript rather than a fenced string, and the
									playground is Monaco with real autocomplete and type errors.
								</Text>
							</HeadingLevels>
						</HeadingLevels>
					</HeadingLevels>
				</Prose>
			</main>
		</>
	);
}

import { Code } from '@luke-ui/react/code';
import { Heading, HeadingLevels } from '@luke-ui/react/heading';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { createFileRoute } from '@tanstack/react-router';
import { Card, Cards } from 'fumadocs-ui/components/card';
import type { ReactNode } from 'react';
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
			<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-16 md:px-6 md:py-24">
				<Heading level={1} typography="heading1">
					Introduction
				</Heading>
				<Text elementType="p">
					Luke UI is a React design system built on React Aria Components. It ships static CSS, two
					bundled themes with distinct visual identities, and layout utilities on a shared semantic
					token contract.
				</Text>
				<Cards>
					<Card href="/docs/installation" title="Installation">
						Install Luke UI, apply a bundled theme, and render a component.
					</Card>
					<Card href="/components" title="Components">
						Browse Components for the full catalogue
					</Card>
				</Cards>
				<HeadingLevels base={2}>
					<Stack gap="sp48">
						<FeatureGroup title="Core values">
							<Feature title="Themes with distinct identities">
								Not accent-colour swapping. <Code>paper</Code> and <Code>tactile</Code> are
								different visual identities built from the same components, with tonal ramps derived
								in Oklch and contrast validated rather than eyeballed.
							</Feature>
							<Feature title="Static CSS">
								Vanilla Extract, no runtime. Themes apply via <Code>:where(:root)</Code> and an
								identity class, so there is no provider to mount and portals inherit.
							</Feature>
							<Feature title="Composed components and primitives">
								Composed components for the common case, the primitives they are built from exported
								alongside them, and React Aria Components as a peer dependency to drop down another
								level.
							</Feature>
							<Feature title="Text sits where you put it">
								Capsize trims the leading so spacing is between the visible letters. Headings take
								their level from context instead of being hand-numbered.
							</Feature>
						</FeatureGroup>
						<FeatureGroup title="Design decisions">
							<Feature title="Async buttons">
								<Code>pressAction</Code> owns the pending state, so consumers do not track loading
								themselves.
							</Feature>
							<Feature title="Loading placeholders that shrink-wrap">
								Skeleton and spinner take the size of the content they stand in for, so nothing
								shifts when it arrives.
							</Feature>
							<Feature title="Examples that cannot drift">
								Every docs example is type-checked TypeScript rather than a fenced string, and the
								playground is Monaco with real autocomplete and type errors.
							</Feature>
						</FeatureGroup>
					</Stack>
				</HeadingLevels>
			</main>
		</>
	);
}

function FeatureGroup({ children, title }: { children: ReactNode; title: string }) {
	return (
		<Stack gap="sp24">
			<Heading>{title}</Heading>
			<HeadingLevels>
				<Stack gap="sp24">{children}</Stack>
			</HeadingLevels>
		</Stack>
	);
}

function Feature({ children, title }: { children: ReactNode; title: string }) {
	return (
		<Stack gap="sp8">
			<Heading>{title}</Heading>
			<Text elementType="p">{children}</Text>
		</Stack>
	);
}

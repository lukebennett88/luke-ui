import { Heading } from '@luke-ui/react/heading';
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
			<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-16 md:px-6 md:py-24">
				<Heading level={1} size="heading1">
					Introduction
				</Heading>
				<Text color="secondary" elementType="p">
					Components, themes, and layout utilities for React applications.
				</Text>
				<Text elementType="p">
					Luke UI is a React design system and component library. It ships static CSS, two bundled
					themes, and layout utilities that share a semantic token contract.
				</Text>
				<Cards>
					<Card href="/docs/installation" title="Installation">
						Install Luke UI, apply a bundled theme, and render a component.
					</Card>
					<Card href="/components" title="Components">
						Browse Components for the full catalogue
					</Card>
				</Cards>
			</main>
		</>
	);
}

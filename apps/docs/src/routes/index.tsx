import { Heading } from '@luke-ui/react/heading';
import { Text } from '@luke-ui/react/text';
import { createFileRoute } from '@tanstack/react-router';
import Link from 'fumadocs-core/link';
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
				<Heading level={1} size="800">
					Introduction
				</Heading>
				<Text color="secondary" elementType="p">
					Components, themes, and layout utilities for React applications.
				</Text>
				<Text elementType="p">
					Luke UI is a React design system and component library. It ships static CSS, two bundled
					themes, and layout utilities that share a semantic token contract.
				</Text>
				<Text elementType="p">
					Read <Link href="/docs/installation">Getting started</Link> to install Luke UI, load a
					theme, and render your first component. Browse <Link href="/components">Components</Link>{' '}
					for the full catalogue.
				</Text>
			</main>
		</>
	);
}

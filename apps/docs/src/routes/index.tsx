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
					Luke UI is a React based design system and component library for building applications. It
					ships static CSS, two bundled themes, and layout utilities that share one semantic token
					contract with its components.
				</Text>
				<Text elementType="p">
					Use Luke UI when you need an accessible component, a visual foundation you can theme, or
					responsive layout without writing CSS.
				</Text>
				<Text elementType="p">
					Read <Link href="/docs/installation">Getting started</Link> to install Luke UI, load a
					theme, and render your first component. Browse <Link href="/components">Components</Link>{' '}
					for the full catalogue of atoms, composed components, and primitives.
				</Text>
			</main>
		</>
	);
}

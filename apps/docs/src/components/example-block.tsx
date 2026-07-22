import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { cx } from '@luke-ui/react/utils';
import { Link } from '@tanstack/react-router';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import type { ComponentType, JSX } from 'react';
import { Suspense, use, useId, useState } from 'react';
import { css } from '../../styled-system/css';
import { encodeCodeHash } from '../lib/playground-hash';
import { StoryWrapper } from '../lib/story-wrapper';

type ExampleBlockProps = {
	src: string;
	description: string;
	title: string;
	mode?: 'inset' | 'full-bleed';
};

export function ExampleBlock(props: ExampleBlockProps): JSX.Element {
	return (
		<Suspense fallback={<Box className={exampleBlockStyles.loading}>Loading example…</Box>}>
			<ExampleContent {...props} />
		</Suspense>
	);
}

const _modules = import.meta.glob<ComponentType>('../examples/*/*.tsx', {
	eager: false,
	import: 'default',
});

function ExampleContent({ mode, src, title }: ExampleBlockProps): JSX.Element {
	const slashIndex = src.indexOf('/');
	const component = src.slice(0, slashIndex);
	const name = src.slice(slashIndex + 1);
	const result = use(loadExample(component, name));
	const [showCode, setShowCode] = useState(false);
	const codeId = useId();

	if (!result.ok) {
		return (
			<Box className={exampleBlockStyles.error}>
				Failed to load example {component}/{name}: {result.error.message}
			</Box>
		);
	}

	const [PreviewComponent, source] = result.data;

	return (
		<Box className={cx('not-prose', exampleBlockStyles.root)}>
			<Box className={exampleBlockStyles.header}>
				<span className={exampleBlockStyles.title}>{title}</span>
				<Box className={exampleBlockStyles.actions}>
					<Link
						className={exampleBlockStyles.playgroundLink}
						hash={encodeCodeHash(source.trim())}
						target="_blank"
						to="/playground"
					>
						<Icon aria-hidden name="externalLink" />
						Open in playground
					</Link>
					<Button
						aria-controls={codeId}
						aria-expanded={showCode}
						onClick={() => setShowCode((previous) => !previous)}
						appearance="ghost"
						size="small"
						type="button"
					>
						<Icon aria-hidden name="codeBlock" />
						{showCode ? 'Hide code' : 'Show code'}
					</Button>
				</Box>
			</Box>
			<StoryWrapper mode={mode}>
				<PreviewComponent />
			</StoryWrapper>
			{showCode ? (
				<Box id={codeId}>
					<DynamicCodeBlock
						code={source.trim()}
						codeblock={{ className: 'my-0 rounded-none border-x-0 border-b-0 shadow-none' }}
						lang="tsx"
					/>
				</Box>
			) : null}
		</Box>
	);
}

const exampleBlockStyles = {
	actions: css({ alignItems: 'center', display: 'flex', gap: '100' }),
	error: css({
		borderColor: 'intent.danger.border',
		borderRadius: 'control',
		borderStyle: 'solid',
		borderWidth: '1px',
		color: 'intent.danger.text',
		padding: '400',
	}),
	header: css({
		alignItems: 'center',
		backgroundColor: 'surface.recessed',
		borderBlockEndColor: 'border.decorative',
		borderBlockEndStyle: 'solid',
		borderBlockEndWidth: '1px',
		display: 'flex',
		gap: '200',
		justifyContent: 'space-between',
		paddingBlock: '200',
		paddingInline: '400',
	}),
	loading: css({
		borderColor: 'border.decorative',
		borderRadius: 'control',
		borderStyle: 'solid',
		borderWidth: '1px',
		padding: '400',
	}),
	playgroundLink: css({
		alignItems: 'center',
		color: 'intent.accent.text',
		display: 'inline-flex',
		fontFamily: 'family',
		fontSize: '100',
		gap: '100',
		minBlockSize: 'controlSize.small',
		paddingInline: '300',
		textDecoration: 'none',
		'&:hover': { textDecoration: 'underline' },
	}),
	root: css({
		borderColor: 'border.decorative',
		borderRadius: 'control',
		borderStyle: 'solid',
		borderWidth: '1px',
		overflow: 'hidden',
	}),
	title: css({
		color: 'text.secondary',
		fontFamily: 'family',
		fontSize: '100',
	}),
};

const _sources = import.meta.glob<string>('../examples/*/*.tsx', {
	eager: false,
	import: 'default',
	query: '?raw',
});

type ExampleTuple = [ComponentType, string];

type ExampleResult =
	| {
			ok: true;
			data: ExampleTuple;
	  }
	| {
			ok: false;
			error: Error;
	  };

const exampleCache = new Map<string, Promise<ExampleResult>>();

function findExample(
	component: string,
	name: string,
): [() => Promise<ComponentType>, () => Promise<string>] | null {
	const key = `../examples/${component}/${name}.tsx`;
	const loadModule = _modules[key];
	const loadSource = _sources[key];

	if (!loadModule || !loadSource) return null;

	return [loadModule, loadSource];
}

function loadExample(component: string, name: string): Promise<ExampleResult> {
	const key = `${component}/${name}`;
	const cached = exampleCache.get(key);
	if (cached) return cached;

	const match = findExample(component, name);
	if (!match) {
		const promise = Promise.resolve({
			error: new Error(`Example not found: ${component}/${name}`),
			ok: false,
		} satisfies ExampleResult);
		exampleCache.set(key, promise);
		return promise;
	}

	const [loadModule, loadSource] = match;
	const promise = Promise.all([loadModule(), loadSource()])
		.then(
			([loadedComponent, loadedSource]): ExampleResult => ({
				data: [loadedComponent, loadedSource],
				ok: true,
			}),
		)
		.catch(
			(err): ExampleResult => ({
				error: err instanceof Error ? err : new Error(String(err)),
				ok: false,
			}),
		);

	exampleCache.set(key, promise);
	return promise;
}

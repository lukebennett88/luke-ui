import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';
import { Icon } from '@luke-ui/react/icon';
import { IconButton } from '@luke-ui/react/icon-button';
import { Kbd } from '@luke-ui/react/kbd';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

export default () => {
	const fixtures = useRef<HTMLElement>(null);
	const [results, setResults] = useState<Array<Result>>([]);
	const [environment, setEnvironment] = useState('');

	useEffect(() => {
		let isActive = true;
		void document.fonts.ready.then(() => {
			const root = fixtures.current;
			if (!isActive || root == null) return;
			setResults(measure(root));
			setEnvironment(
				[
					navigator.userAgent,
					`cap unit: ${CSS.supports('block-size', '1cap') ? 'yes' : 'no'}`,
					`first baseline: ${CSS.supports('align-items', 'first baseline') ? 'yes' : 'no'}`,
				].join(' · '),
			);
		});
		return () => {
			isActive = false;
		};
	}, []);

	return (
		<Stack gap="sp24">
			<Stack gap="sp8">
				{results.map(({ name, offset }) => {
					return (
						<Text key={name} typography="label">
							{name}:{' '}
							<Text
								color={Math.abs(offset) <= 0.5 ? 'success' : 'danger'}
								fontVariantNumeric="tabular-nums"
								typography="label"
							>
								{`${offset >= 0 ? '+' : ''}${offset.toFixed(2)}px`}
							</Text>
						</Text>
					);
				})}
				<Text color="secondary" typography="caption">
					{environment}
				</Text>
			</Stack>
			<Stack gap="sp16" maxInlineSize="16rem" ref={fixtures}>
				{centreCases.map(({ name, node }) => {
					return (
						<div data-case={name} key={name}>
							{node}
						</div>
					);
				})}
				<Box
					alignItems="baseline"
					data-case="Capsize: trimmed Heading beside Text"
					display="flex"
					gap="sp8"
				>
					<Heading level={3} typography="heading3">
						<span data-baseline style={baselineProbe} />
						Trimmed
					</Heading>
					<Text>
						<span data-baseline style={baselineProbe} />
						untrimmed
					</Text>
				</Box>
			</Stack>
		</Stack>
	);
};

// A zero-width box one cap height tall, sitting on the baseline, spans the capitals of its line.
const capProbe = {
	blockSize: '1cap',
	display: 'inline-block',
	inlineSize: 0,
} satisfies CSSProperties;
// The baseline of the line a zero-size inline-block sits on is its bottom edge.
const baselineProbe = {
	blockSize: 0,
	display: 'inline-block',
	inlineSize: 0,
} satisfies CSSProperties;

const cap = <span data-cap style={capProbe} />;

const avatar = (
	<Box
		aria-hidden="true"
		backgroundColor="neutral.subtle.rest"
		blockSize="2.5rem"
		borderRadius="full"
		data-graphic
		display="inline-flex"
		elementType="span"
		inlineSize="2.5rem"
	/>
);

type Result = { name: string; offset: number };

const centreCases: Array<{ name: string; node: ReactNode }> = [
	{
		name: 'Heading startContent',
		node: (
			<Heading level={3} startContent={<Icon name="checkCircle" />} typography="heading3">
				{cap}Section heading that wraps
			</Heading>
		),
	},
	{
		name: 'label Text with Kbd',
		node: (
			<Text
				elementType="p"
				endContent={<Kbd>Esc</Kbd>}
				startContent={<Icon name="bookOpen" size="small" />}
				typography="label"
			>
				{cap}Example message that wraps onto a second line
			</Text>
		),
	},
	{
		name: 'caption with a tall icon',
		node: (
			<Text elementType="p" startContent={<Icon name="checkCircle" />} typography="caption">
				{cap}Caption text beside a medium icon
			</Text>
		),
	},
	{
		name: 'inline in a sentence',
		node: (
			<Text elementType="p">
				Status: <Text startContent={<Icon name="checkCircle" size="xsmall" />}>{cap}Approved</Text>{' '}
				by the reviewer.
			</Text>
		),
	},
	{
		name: 'IconButton endContent',
		node: (
			<Text
				elementType="p"
				endContent={<IconButton aria-label="Dismiss" icon="close" prominence="low" size="small" />}
			>
				{cap}Example message that wraps onto a second line
			</Text>
		),
	},
	{
		name: 'Compound: avatar beside a body title',
		node: (
			<Text
				elementType="div"
				endContent={<IconButton aria-label="Dismiss" icon="close" prominence="low" size="small" />}
				gap="sp12"
				startContent={avatar}
			>
				<Stack gap="sp4">
					<Text fontWeight="emphasis">{cap}Notification title</Text>
					<Text color="secondary" typography="caption">
						Description that may wrap onto multiple lines
					</Text>
				</Stack>
			</Text>
		),
	},
	{
		name: 'Compound: avatar beside a heading3 title',
		node: (
			<Text
				elementType="div"
				endContent={<IconButton aria-label="Dismiss" icon="close" prominence="low" size="small" />}
				startContent={avatar}
				typography="heading3"
			>
				<Stack gap="sp8">
					<Text elementType="p" shouldInheritFont>
						{cap}Title in the outer Text's typography
					</Text>
					<Text color="secondary" elementType="p" typography="caption">
						Description below the primary text
					</Text>
				</Stack>
			</Text>
		),
	},
];

/** Offsets of each fixture: a graphic's centre from its line's capitals, or two baselines apart. */
function measure(root: HTMLElement): Array<Result> {
	return [...root.querySelectorAll<HTMLElement>('[data-case]')].flatMap((fixture) => {
		const name = fixture.dataset.case ?? '';
		const baselines = [...fixture.querySelectorAll('[data-baseline]')];
		const [first, second] = baselines;
		if (first != null && second != null) {
			return [
				{
					name,
					offset: second.getBoundingClientRect().bottom - first.getBoundingClientRect().bottom,
				},
			];
		}
		const capElement = fixture.querySelector('[data-cap]');
		const graphic =
			fixture.querySelector('[data-graphic]') ??
			fixture.querySelector('button') ??
			fixture.querySelector('svg');
		if (capElement == null || graphic == null) return [];
		return [{ name, offset: centreOf(graphic) - centreOf(capElement) }];
	});
}

function centreOf(element: Element): number {
	const rect = element.getBoundingClientRect();
	return rect.top + rect.height / 2;
}

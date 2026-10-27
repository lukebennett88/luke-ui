import { Box } from '@luke-ui/react/box';
import { Code } from '@luke-ui/react/code';
import { Em } from '@luke-ui/react/em';
import { Emoji } from '@luke-ui/react/emoji';
import { Kbd } from '@luke-ui/react/kbd';
import { Numeral } from '@luke-ui/react/numeral';
import { Quote } from '@luke-ui/react/quote';
import { Strong } from '@luke-ui/react/strong';
import { Text } from '@luke-ui/react/text';
import type { CSSProperties } from 'react';
import { createRef } from 'react';
import { Menu, MenuItem } from 'react-aria-components/Menu';
import { TextContext } from 'react-aria-components/Text';
import { expect, test, vi } from 'vite-plus/test';
import { SEMANTIC_ROLES } from '../../theme/contrast-policy.js';
import { typeStyles } from '../../theme/type-styles.js';
import { expectAxeContrastPasses } from '../test-utils/axe.js';
import { INTER_CAP_HEIGHT_EM, loadInter } from '../test-utils/load-inter.js';
import { measureBaseline, measureLastBaseline } from '../test-utils/measure-first-line.js';
import { render, visualAppearances } from '../test-utils/render.js';
import type { ForegroundSlot, PairedBackground } from '../test-utils/surface-colors.js';
import { pairedTokens, resolvedColor } from '../test-utils/surface-colors.js';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	Stack,
} from '../test-utils/visual.js';

const slottedTextContext = { slots: { description: {}, errorMessage: {} } };

test('Text fills a React Aria MenuItem label and description', async () => {
	const { locator } = render(
		<Menu aria-label="Actions">
			<MenuItem>
				<Text slot="label" typography="label">
					Save changes
				</Text>
				<Text color="secondary" slot="description" typography="caption">
					Updates the current document
				</Text>
			</MenuItem>
		</Menu>,
	);

	const item = locator.getByRole('menuitem');
	await expect.element(item).toHaveAccessibleName('Save changes');
	await expect.element(item).toHaveAccessibleDescription('Updates the current document');
});

test('Text slot null opts out of surrounding slotted text context', () => {
	const { locator } = render(
		<TextContext.Provider value={slottedTextContext}>
			<Text slot={null}>Opted out label</Text>
		</TextContext.Provider>,
	);

	expect(locator.getByText('Opted out label').element().tagName).toBe('SPAN');
});

test('trimmed block Text shares a baseline with a sibling in a baseline-aligned flex row', () => {
	// Chromium takes a block's first baseline from an empty `display: table` trim box, which would
	// move the trimmed text off its siblings' baseline.
	const { locator } = render(
		<div style={{ alignItems: 'baseline', display: 'flex', gap: '8px' }}>
			<Text data-testid="trimmed" elementType="p">
				Trimmed paragraph
			</Text>
			<span data-testid="untrimmed">Untrimmed span</span>
		</div>,
	);
	const trimmed = measureBaseline(locator.getByTestId('trimmed').element());
	const untrimmed = measureBaseline(locator.getByTestId('untrimmed').element());

	expect(Math.abs(trimmed - untrimmed)).toBeLessThanOrEqual(0.5);
});

// Layout follows the Capsize trims, which are computed from Inter's metrics. Without Inter loaded,
// text falls back to a system font and the trims no longer match it.
for (const typography of ['body', 'heading2'] as const) {
	test(`${typography} Text is trimmed to its capitals and its last baseline in Inter`, async () => {
		await loadInter();
		const { locator } = render(
			<div style={{ inlineSize: '16rem' }}>
				<Text data-testid="text" elementType="p" typography={typography}>
					This paragraph is long enough that it wraps across several lines in the fixed width.
				</Text>
			</div>,
		);
		const text = locator.getByTestId('text').element();
		const { bottom, top } = text.getBoundingClientRect();
		const firstBaseline = measureBaseline(text);
		const lastBaseline = measureLastBaseline(text);
		const fontSize = Number.parseFloat(getComputedStyle(text).fontSize);

		expect(lastBaseline - firstBaseline).toBeGreaterThan(fontSize * 2);
		expect(Math.abs(top - (firstBaseline - INTER_CAP_HEIGHT_EM * fontSize))).toBeLessThanOrEqual(
			0.5,
		);
		expect(Math.abs(bottom - lastBaseline)).toBeLessThanOrEqual(0.5);
	});
}

// Inline typography sits inside a field's label, description, or error, where React Aria provides
// slotted text context. It never fills a slot.
const inlineTypography = [
	{ element: <Code>Inline code</Code>, name: 'Code', text: 'Inline code' },
	{ element: <Em>Inline emphasis</Em>, name: 'Em', text: 'Inline emphasis' },
	{ element: <Emoji emoji="🙂" label="Inline emoji" />, name: 'Emoji', text: '🙂' },
	{ element: <Kbd>Inline key</Kbd>, name: 'Kbd', text: 'Inline key' },
	{ element: <Quote>Inline quote</Quote>, name: 'Quote', text: 'Inline quote' },
	{ element: <Strong>Inline strong</Strong>, name: 'Strong', text: 'Inline strong' },
];

for (const { element, name, text } of inlineTypography) {
	test(`${name} renders inside slotted text context without a slot`, () => {
		const { locator } = render(
			<TextContext.Provider value={slottedTextContext}>{element}</TextContext.Provider>,
		);

		expect(locator.getByText(text).element()).toBeInTheDocument();
	});
}

test('Text isVisuallyHidden keeps named slots without an extra wrapper', async () => {
	const { locator } = render(
		<Menu aria-label="Actions">
			<MenuItem>
				<Text isVisuallyHidden slot="label" typography="label">
					Save changes
				</Text>
				<Text isVisuallyHidden slot="description">
					Updates the current document
				</Text>
			</MenuItem>
		</Menu>,
	);
	const item = locator.getByRole('menuitem');
	const label = locator.getByText('Save changes').element();
	const description = locator.getByText('Updates the current document').element();

	expect(label.tagName).toBe('SPAN');
	expect(label.parentElement).toBe(item.element());
	expect(description.parentElement).toBe(item.element());
	await expect.element(item).toHaveAccessibleName('Save changes');
	await expect.element(item).toHaveAccessibleDescription('Updates the current document');
});

test('Text isVisuallyHidden keeps slot null opt-out without an extra wrapper', () => {
	const { locator, container } = render(
		<TextContext.Provider value={slottedTextContext}>
			<Text isVisuallyHidden slot={null}>
				Hidden opted out
			</Text>
		</TextContext.Provider>,
	);
	const label = locator.getByText('Hidden opted out').element();

	expect(label.tagName).toBe('SPAN');
	expect(container.firstElementChild).toBe(label);
	expect(container.childElementCount).toBe(1);
});

test('Text isVisuallyHidden hides visually while keeping accessible text', async () => {
	const { locator, container } = render(
		<button type="button">
			<Text isVisuallyHidden style={{ color: 'rgb(1, 2, 3)' }}>
				Save changes
			</Text>
		</button>,
	);
	const label = locator.getByText('Save changes').element();

	expect(label.tagName).toBe('SPAN');
	expect(container.firstElementChild).toBe(label.parentElement);
	expect(label.style.color).toBe('rgb(1, 2, 3)');
	await expect.element(locator.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
});

test('ordinary Text remains a single React Aria Text root', () => {
	const { locator, container } = render(<Text>Body copy</Text>);
	const text = locator.getByText('Body copy').element();

	expect(text.tagName).toBe('SPAN');
	expect(container.firstElementChild).toBe(text);
	expect(container.childElementCount).toBe(1);
});

test('Text renderRoot participates in a public React Aria menu collection', async () => {
	const { locator } = render(
		<Menu aria-label="Actions">
			<MenuItem>
				<Text
					renderRoot={(domProps) => <span {...domProps} data-testid="owned-menu-label" />}
					slot="label"
				>
					Save changes
				</Text>
			</MenuItem>
		</Menu>,
	);
	const item = locator.getByRole('menuitem');

	await expect.element(item).toHaveAccessibleName('Save changes');
	expect(locator.getByTestId('owned-menu-label').element().tagName).toBe('SPAN');
});

test('Text renderRoot receives an empty state object', () => {
	let receivedState: unknown;
	render(
		<Text
			renderRoot={(domProps, state) => {
				receivedState = state;
				return <span {...domProps} data-testid="stateful-text" />;
			}}
		>
			Owned
		</Text>,
	);

	expect(receivedState).toEqual({});
});

test('Text renderRoot returns the expected React Aria element without warnings', () => {
	const warning = vi.spyOn(console, 'warn');
	const { locator } = render(
		<Text renderRoot={(domProps) => <span {...domProps} data-testid="contract-text" />}>
			Owned
		</Text>,
	);

	expect(locator.getByTestId('contract-text').element().tagName).toBe('SPAN');
	expect(warning.mock.calls.flat().join(' ')).not.toContain('Unexpected DOM element returned');
	warning.mockRestore();
});

test('Text renderRoot owns its span root with slot, ref, and style merge', async () => {
	const ref = createRef<HTMLElement>();
	const elements: Array<HTMLElement | null> = [];
	let cleanups = 0;
	const { locator, unmount } = render(
		<Menu aria-label="Actions">
			<MenuItem>
				<Text
					className="consumer-class"
					data-owned="yes"
					isVisuallyHidden
					ref={(element) => {
						elements.push(element);
						return () => {
							cleanups += 1;
						};
					}}
					renderRoot={(domProps) => <span {...domProps} data-testid="owned-text" />}
					slot="label"
					style={{ color: 'rgb(1, 2, 3)' }}
					typography="label"
				>
					Owned label
				</Text>
				<Text color="secondary" slot="description">
					Helper
				</Text>
			</MenuItem>
		</Menu>,
	);
	const item = locator.getByRole('menuitem');
	const owned = locator.getByTestId('owned-text').element();

	expect(owned.tagName).toBe('SPAN');
	expect(owned.getAttribute('data-owned')).toBe('yes');
	expect(owned.className).toContain('consumer-class');
	expect(owned.style.color).toBe('rgb(1, 2, 3)');
	expect(elements.at(-1)).toBe(owned);
	await expect.element(item).toHaveAccessibleName('Owned label');
	await expect.element(item).toHaveAccessibleDescription('Helper');

	unmount();
	expect(cleanups).toBeGreaterThanOrEqual(1);

	const refResult = render(
		<Text
			ref={ref}
			renderRoot={(domProps) => <span {...domProps} data-testid="owned-span" />}
			slot={null}
		>
			Strong copy
		</Text>,
	);
	expect(ref.current).toBe(refResult.locator.getByTestId('owned-span').element());
	expect(ref.current?.tagName).toBe('SPAN');
	refResult.unmount();
	expect(ref.current).toBeNull();
});

// `shouldInheritFont` inherits `textTransform` and `fontVariantNumeric` along with the other font
// properties, and their variants default to emitting nothing. Without both halves, a composing
// component would reset the surrounding uppercase and numeric styling to `none`/`normal`.
test('components composed on Text inherit surrounding case and numeric styling', () => {
	const { container } = render(
		<Text fontVariantNumeric="tabular-nums" textTransform="uppercase">
			total <Code>abc123</Code> <Kbd>esc</Kbd> <Em>em</Em> <Strong>strong</Strong>
		</Text>,
	);

	for (const selector of ['code', 'kbd', 'em', 'strong']) {
		const element = container.querySelector(selector);
		if (!(element instanceof HTMLElement)) throw new Error(`Expected a ${selector} element.`);

		const styles = getComputedStyle(element);
		expect(styles.textTransform).toBe('uppercase');
		expect(styles.fontVariantNumeric).toBe('tabular-nums');
	}
});

test('an explicit textTransform still wins over the inherited one', () => {
	// `textTransform` is declared after `shouldInheritFont`, so an explicit value outranks the
	// inherited one. Nested `Text` stands in for any composed component that forwards the prop.
	const { container } = render(
		<Text textTransform="uppercase">
			total{' '}
			<Text elementType="em" shouldInheritFont textTransform="lowercase">
				ABC
			</Text>
		</Text>,
	);
	const nested = container.querySelector('em');
	if (!(nested instanceof HTMLElement)) throw new Error('Expected the nested Text element.');

	expect(getComputedStyle(nested).textTransform).toBe('lowercase');
});

test('Text on its own does not inherit case or numeric styling from the page', () => {
	// The resets live in the recipe base, so a plain `Text` stays insulated from ambient page
	// styling. Only `shouldInheritFont` lifts them.
	const { container } = render(
		<div style={{ fontVariantNumeric: 'tabular-nums', textTransform: 'uppercase' }}>
			<Text>Body copy</Text>
		</div>,
	);
	const text = container.querySelector('span');
	if (!(text instanceof HTMLElement)) throw new Error('Expected a Text element.');

	const styles = getComputedStyle(text);
	expect(styles.textTransform).toBe('none');
	expect(styles.fontVariantNumeric).toBe('normal');
});

const TEXT_COLORS = [
	'primary',
	'secondary',
	'neutral',
	'accent',
	'info',
	'success',
	'warning',
	'danger',
] as const satisfies ReadonlyArray<ForegroundSlot>;

const CONTEXT_BACKGROUNDS = [
	'surface.base',
	'surface.subdued',
	'neutral.subtle',
	'danger.subtle',
	'accent.solid',
	'warning.solid',
] as const satisfies ReadonlyArray<PairedBackground>;

function byTestId(container: HTMLElement, id: string): HTMLElement {
	const element = container.querySelector<HTMLElement>(`[data-testid="${id}"]`);
	if (element === null) throw new Error(`Expected [data-testid="${id}"].`);
	return element;
}

function colorOf(element: Element): string {
	return getComputedStyle(element).color;
}

for (const appearance of visualAppearances) {
	const name = `${appearance.theme} ${appearance.mode}`;

	test(`Text without a colour inherits the surrounding colour in ${name}`, () => {
		const { container } = render(
			<>
				<Box backgroundColor="accent.solid" data-testid="solid">
					<Text data-testid="on-solid">On solid</Text>
				</Box>
				<Box backgroundColor="warning.subtle" data-testid="subtle">
					<Text data-testid="on-subtle">On subtle</Text>
				</Box>
				<span data-testid="custom" style={{ color: 'rgb(1, 2, 3)' }}>
					<Text data-testid="in-custom">In custom colour</Text>
				</span>
			</>,
			{ appearance },
		);

		for (const [parent, text] of [
			['solid', 'on-solid'],
			['subtle', 'on-subtle'],
			['custom', 'in-custom'],
		] as const) {
			expect(colorOf(byTestId(container, text))).toBe(colorOf(byTestId(container, parent)));
		}
	});

	test(`explicit Text colours resolve against the nearest background in ${name}`, () => {
		const { container } = render(
			<>
				{CONTEXT_BACKGROUNDS.map((background) => (
					<Box backgroundColor={background} key={background}>
						{TEXT_COLORS.map((color) => (
							<Text color={color} data-testid={`${background} ${color}`} key={color}>
								{color}
							</Text>
						))}
					</Box>
				))}
			</>,
			{ appearance },
		);

		for (const background of CONTEXT_BACKGROUNDS) {
			const tokens = pairedTokens(background);
			for (const color of TEXT_COLORS) {
				const text = byTestId(container, `${background} ${color}`);
				expect(colorOf(text)).toBe(resolvedColor(tokens[color], text));
			}
		}
		// A semantic role keeps its hue on a subtle fill but collapses on a solid one.
		const subtleDanger = byTestId(container, 'neutral.subtle danger');
		const solidDanger = byTestId(container, 'accent.solid danger');
		expect(colorOf(subtleDanger)).not.toBe(colorOf(byTestId(container, 'neutral.subtle primary')));
		expect(colorOf(solidDanger)).toBe(colorOf(byTestId(container, 'accent.solid primary')));
	});

	test(`Text colours follow nested backgrounds and colour-mode scopes in ${name}`, () => {
		const scopeMode = appearance.mode === 'light' ? 'dark' : 'light';
		const { container } = render(
			<Box backgroundColor="success.solid" padding="space.8">
				<span style={{ color: 'rgb(1, 2, 3)' }}>
					<Text color="primary" data-testid="reset-primary">
						Primary
					</Text>
				</span>
				<Box backgroundColor="info.subtle" data-testid="subtle" padding="space.8">
					<Text color="danger" data-testid="subtle-danger">
						Danger
					</Text>
					<Box backgroundColor="danger.solid" data-testid="inner-solid" padding="space.8">
						<Text color="secondary" data-testid="inner-secondary">
							Secondary
						</Text>
					</Box>
				</Box>
				<div data-color-mode={scopeMode} data-testid="scope">
					<Text color="secondary" data-testid="scope-secondary">
						Scoped
					</Text>
				</div>
			</Box>,
			{ appearance },
		);
		const resetPrimary = byTestId(container, 'reset-primary');
		const subtleDanger = byTestId(container, 'subtle-danger');
		const innerSecondary = byTestId(container, 'inner-secondary');
		const scopeSecondary = byTestId(container, 'scope-secondary');

		// Explicit primary ignores the custom colour between it and the background.
		expect(colorOf(resetPrimary)).toBe(
			resolvedColor(pairedTokens('success.solid').primary, resetPrimary),
		);
		expect(colorOf(subtleDanger)).toBe(
			resolvedColor(pairedTokens('info.subtle').danger, subtleDanger),
		);
		expect(colorOf(innerSecondary)).toBe(
			resolvedColor(pairedTokens('danger.solid').secondary, innerSecondary),
		);
		expect(colorOf(scopeSecondary)).toBe(
			resolvedColor(pairedTokens('surface.base').secondary, scopeSecondary),
		);
		expect(colorOf(scopeSecondary)).not.toBe(
			resolvedColor(pairedTokens('surface.base').secondary, byTestId(container, 'subtle')),
		);
	});

	test(`font and style overrides never reset colour in ${name}`, () => {
		const { container } = render(
			<Box backgroundColor="accent.solid" data-testid="solid">
				<Text data-testid="inherit-font" shouldInheritFont>
					Inherited font
				</Text>
				<Text color="secondary" data-testid="inherit-font-secondary" shouldInheritFont>
					Inherited font, secondary
				</Text>
				<Text
					data-testid="styled"
					fontStyle="italic"
					fontWeight="heading"
					textTransform="uppercase"
					typography="heading2"
				>
					Styled
				</Text>
				<Text color="danger" data-testid="inline-style" style={{ color: 'rgb(1, 2, 3)' }}>
					Inline style
				</Text>
			</Box>,
			{ appearance },
		);
		const solid = byTestId(container, 'solid');
		const inheritFontSecondary = byTestId(container, 'inherit-font-secondary');

		expect(colorOf(byTestId(container, 'inherit-font'))).toBe(colorOf(solid));
		expect(colorOf(byTestId(container, 'styled'))).toBe(colorOf(solid));
		expect(colorOf(inheritFontSecondary)).toBe(
			resolvedColor(pairedTokens('accent.solid').secondary, inheritFontSecondary),
		);
		expect(colorOf(byTestId(container, 'inline-style'))).toBe('rgb(1, 2, 3)');
	});

	test(`typography-only components keep the colour around them in ${name}`, () => {
		const { container } = render(
			<Box backgroundColor="neutral.subtle">
				<Text color="secondary" data-testid="secondary">
					Supporting <Strong>strong</Strong> <Em>em</Em> <Quote>quote</Quote>{' '}
					<Emoji emoji="👋" label="Wave" /> <Numeral value={42} />
				</Text>
				<Text color="danger" data-testid="danger">
					Error <Strong>strong</Strong>
				</Text>
			</Box>,
			{ appearance },
		);

		for (const id of ['secondary', 'danger']) {
			const text = byTestId(container, id);
			const descendants = text.querySelectorAll('strong, em, q, [role="img"], span span');
			expect(descendants.length).toBeGreaterThan(0);
			for (const descendant of descendants) {
				expect(colorOf(descendant)).toBe(colorOf(text));
			}
		}
		expect(colorOf(byTestId(container, 'secondary'))).not.toBe(
			colorOf(byTestId(container, 'danger')),
		);
	});
}

test('contextual colours', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator: scene } = render(
			<Stack>
				{CONTEXT_BACKGROUNDS.map((background) => (
					<Box
						backgroundColor={background}
						display="flex"
						flexWrap="wrap"
						gap="space.12"
						key={background}
						padding="space.8"
					>
						{TEXT_COLORS.map((color) => (
							<Text color={color} key={color}>
								{color}
							</Text>
						))}
					</Box>
				))}
			</Stack>,
			{ appearance },
		);
		await captureVisualAppearance(scene, 'text/contextual-colours', appearance);
	}
});

const rowStyle = {
	alignItems: 'baseline',
	display: 'flex',
	flexWrap: 'wrap',
	gap: '1rem',
} satisfies CSSProperties;

test('typography styles', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
			<Stack width="40rem">
				<div style={rowStyle}>
					{typeStyles.map((typography) => (
						<Text key={typography} typography={typography}>
							{typography}
						</Text>
					))}
				</div>
				<div style={rowStyle}>
					<Text fontWeight="body">Body</Text>
					<Text fontWeight="label">Label</Text>
					<Text fontWeight="heading">Heading</Text>
					<Text fontWeight="emphasis">Emphasis</Text>
				</div>
				<Text fontWeight="emphasis" typography="body">
					Nested defaults and overrides: <Text typography="label">Label default</Text>{' '}
					<Text fontWeight="body" typography="label">
						Label with body weight
					</Text>{' '}
					<Text shouldInheritFont>Inherited emphasis</Text>
				</Text>
				<div style={rowStyle}>
					<Text color="primary">Primary</Text>
					<Text color="secondary">Secondary</Text>
					<Text color="accent">Accent</Text>
					<Text color="info">Info</Text>
					<Text color="success">Success</Text>
					<Text color="warning">Warning</Text>
					<Text color="danger">Danger</Text>
				</div>
				<Text>Trimmed by default</Text>
				<Text shouldDisableTrim>Trim disabled</Text>
			</Stack>,
			{ appearance },
		);

		await captureVisualAppearance(locator, 'text/type-scale', appearance);
	}
});

test('Em, Strong, and Kbd inheritance', { tags: ['visual'] }, async () => {
	const { locator } = render(
		<Stack width="24rem">
			<Text fontWeight="emphasis" typography="lead">
				Read the <Em>full</Em> guide, mark the <Strong>required</Strong> steps, then run{' '}
				<Kbd>Cmd+S</Kbd> to save.
			</Text>
			<Text typography="caption">
				A caption sentence with <Em>emphasis</Em>, <Strong>importance</Strong>, and a <Kbd>Tab</Kbd>{' '}
				key at a smaller size — the Kbd chip stays the same size as above.
			</Text>
		</Stack>,
	);

	await captureVisual(locator, 'text/em-strong-kbd-inheritance');
});

test('line clamp and transforms', { tags: ['visual'] }, async () => {
	const { locator } = render(
		<Stack width="18rem">
			<Text lineClamp={2}>
				A short paragraph of placeholder copy that wraps across multiple lines and then clamps.
			</Text>
			<Text textDecoration="underline" textTransform="uppercase">
				Decorated text
			</Text>
		</Stack>,
	);

	await captureVisual(locator, 'text/line-clamp-transforms');
});

// Every background a Box can paint: the four surfaces and each role's resting fills.
const EVERY_BACKGROUND = [
	'surface.base',
	'surface.subdued',
	'surface.field',
	'surface.raised',
	...SEMANTIC_ROLES.flatMap((role) => [`${role}.subtle`, `${role}.solid`] as const),
] as const satisfies ReadonlyArray<PairedBackground>;

for (const appearance of visualAppearances) {
	// axe measures the rendered colours, independent of the token pairing the other tests compare.
	test(`every Text colour passes axe contrast on every background in ${appearance.theme} ${appearance.mode}`, async () => {
		const { container } = render(
			<Stack>
				{EVERY_BACKGROUND.map((background) => (
					<Box
						backgroundColor={background}
						display="flex"
						flexWrap="wrap"
						gap="space.12"
						key={background}
					>
						{TEXT_COLORS.map((color) => (
							<Text color={color} key={color}>
								{`${color} on ${background}`}
							</Text>
						))}
					</Box>
				))}
			</Stack>,
			{ appearance },
		);

		await expectAxeContrastPasses(container);
	});
}

test('Text on a solid fill takes the system colours in forced colours', async () => {
	await emulateForcedColors('active');

	try {
		const { container } = render(
			<Box backgroundColor="accent.solid" data-testid="fill" padding="space.8">
				<Text color="danger" data-testid="text">
					Danger
				</Text>
			</Box>,
		);
		const fill = byTestId(container, 'fill');
		const text = byTestId(container, 'text');

		expect({
			background: getComputedStyle(fill).backgroundColor,
			color: getComputedStyle(text).color,
		}).toEqual({
			background: resolvedColor('Canvas', fill),
			color: resolvedColor('CanvasText', text),
		});
	} finally {
		await emulateForcedColors('none');
	}
});

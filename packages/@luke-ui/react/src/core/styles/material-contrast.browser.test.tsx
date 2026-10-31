import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { vars } from '@luke-ui/react/theme';
import { expect, test } from 'vite-plus/test';
import { SEMANTIC_ROLES } from '../../theme/contrast-policy.js';
import type { VisualAppearance } from '../test-utils/render.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { lowestRenderedTextContrastAt } from '../test-utils/rendered-contrast.js';
import { setInteractionState, settledSurfaceColors } from '../test-utils/surface-colors.js';

// #955 decisions 16 and 17: `defineTheme` checks token colours, and this suite measures the paint a
// solid fill and its `controlFinish` produce behind `onSolid` text. To gate a custom theme, add its
// `ThemeInput` to `fixtureThemes` in `test-utils/fixture-themes.ts`, add its name to `appearances`
// below, and run the suite with the command in TESTING.md.

const NORMAL_TEXT_RATIO = 4.5;

/** A solid fill's states, and the `controlFinish` rung a solid Button paints in each. */
const states = [
	{ finish: 'resting', name: 'rest' },
	{ finish: 'raised', name: 'hover' },
	{ finish: 'recessed', name: 'pressed' },
] as const;

/** Bundled themes plus a custom theme whose finish stacks overlapping gradient layers. */
const appearances: Array<VisualAppearance> = [
	...visualAppearances,
	{ mode: 'light', theme: 'layeredFinish' },
	{ mode: 'dark', theme: 'layeredFinish' },
];

function Specimens() {
	return (
		<div style={{ display: 'grid', gap: vars.space['8'], justifyItems: 'start' }}>
			{SEMANTIC_ROLES.flatMap((role) =>
				states.map(({ finish, name }) => (
					<div
						data-role={role}
						data-specimen={name}
						key={`${role}-${name}`}
						style={{
							backgroundColor: vars.color.background[role].solid[name],
							backgroundImage: vars.controlFinish[finish],
							color: vars.color.foreground[role].onSolid,
							padding: `${vars.space['8']} ${vars.space['16']}`,
						}}
					>
						<span>Save changes</span>
					</div>
				)),
			)}
		</div>
	);
}

/**
 * The lowest `onSolid` contrast across every role and state, as one line per failure. Each line
 * names the theme, role, mode, state and ratio, and where in the specimen the ratio was measured.
 */
async function materialContrastFailures(appearance: VisualAppearance) {
	const { container } = render(<Specimens />, { appearance });
	const failures: Array<string> = [];
	for (const specimen of container.querySelectorAll<HTMLElement>('[data-specimen]')) {
		const role = specimen.dataset.role;
		const state = specimen.dataset.specimen;
		// oxlint-disable-next-line no-await-in-loop
		const lowest = await lowestRenderedTextContrastAt(specimen);
		if (lowest.contrast >= NORMAL_TEXT_RATIO) continue;
		const { height, width } = specimen.getBoundingClientRect();
		failures.push(
			`${appearance.theme} ${role} ${appearance.mode} ${state}: ${lowest.contrast.toFixed(2)}:1 ` +
				`at ${lowest.x.toFixed(0)},${lowest.y.toFixed(0)}px of ${width.toFixed(0)}x${height.toFixed(0)}px`,
		);
	}
	return failures;
}

for (const appearance of appearances) {
	test(`keeps 4.5:1 onSolid text over every solid fill and finish in ${appearance.theme} ${appearance.mode}`, async () => {
		expect(await materialContrastFailures(appearance)).toEqual([]);
	});
}

/**
 * Real standard and low Buttons of both tones over every role's solid fill, in each state: their
 * fill, finish, and adaptive state layer behind their actual text colour. The page surface is
 * covered by the `onSolid` specimens above and by the Button suite's surface checks.
 */
async function buttonFinishFailures(appearance: VisualAppearance) {
	const { container } = render(
		<>
			{SEMANTIC_ROLES.map((role) => (
				<Box backgroundColor={`${role}.solid`} data-role={role} key={role} padding="space.8">
					{(['standard', 'low'] as const).flatMap((prominence) =>
						(['neutral', 'danger'] as const).map((tone) => (
							<Button key={`${prominence}-${tone}`} prominence={prominence} tone={tone}>
								{prominence} {tone} in {role}
							</Button>
						)),
					)}
				</Box>
			))}
		</>,
		{ appearance },
	);
	const failures: Array<string> = [];
	for (const button of container.querySelectorAll<HTMLElement>('button')) {
		const role = button.closest<HTMLElement>('[data-role]')?.dataset.role;
		for (const state of ['rest', 'hover', 'pressed'] as const) {
			setInteractionState(button, state);
			settledSurfaceColors(button);
			// oxlint-disable-next-line no-await-in-loop
			const { contrast } = await lowestRenderedTextContrastAt(button);
			if (contrast < NORMAL_TEXT_RATIO) {
				failures.push(
					`${appearance.theme} ${role} ${appearance.mode} ${state} "${button.textContent}": ` +
						`${contrast.toFixed(2)}:1`,
				);
			}
		}
	}
	return failures;
}

for (const appearance of appearances) {
	test(
		`keeps 4.5:1 text on standard and low Buttons over every role solid in ${appearance.theme} ${appearance.mode}`,
		{ timeout: 60_000 },
		async () => {
			expect(await buttonFinishFailures(appearance)).toEqual([]);
		},
	);
}

// The failing finish is transparent at both ends, so only sampling the whole painted area finds it.
for (const mode of ['light', 'dark'] as const) {
	test(`detects a mid-gradient finish failure in ${mode} mode`, async () => {
		const failures = await materialContrastFailures({ mode, theme: 'midBandFailure' });

		expect(failures.length, 'failing specimens').toBeGreaterThan(0);
		for (const failure of failures) {
			expect(failure).toMatch(new RegExp(`^midBandFailure \\w+ ${mode} (rest|hover|pressed): `));
			// The lowest ratio sits in the middle band, not at an endpoint of the gradient.
			const [, y, height] = /at \d+,(\d+)px of \d+x(\d+)px/.exec(failure)!.map(Number);
			expect(y! / height!, 'vertical position of the lowest ratio').toBeGreaterThan(0.3);
			expect(y! / height!, 'vertical position of the lowest ratio').toBeLessThan(0.7);
		}
	});
}

// The gate must fail closed: a measurement over no pixels is not a pass.
test('throws when no pixels are sampled behind the text', async () => {
	const { container } = render(
		<div style={{ height: 40, position: 'relative', width: 100 }}>
			<span style={{ left: -200, position: 'absolute' }}>Save changes</span>
		</div>,
	);

	await expect(
		lowestRenderedTextContrastAt(container.firstElementChild as HTMLElement),
	).rejects.toThrow('No pixels were sampled');
});

// A flat wash lightens every solid fill under its text. Paper's dark appearance has the same colours
// and passes above, so only the finish can be the cause of these failures.
test('detects a flat finish wash failing text contrast in dark mode', async () => {
	const failures = await materialContrastFailures({ mode: 'dark', theme: 'washFailure' });

	expect(failures.length, 'failing specimens').toBeGreaterThan(0);
	for (const failure of failures) {
		expect(failure).toMatch(/^washFailure \w+ dark (rest|hover|pressed): /);
	}
});

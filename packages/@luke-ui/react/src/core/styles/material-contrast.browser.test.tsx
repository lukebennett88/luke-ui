import { vars } from '@luke-ui/react/theme';
import { expect, test } from 'vite-plus/test';
import { SEMANTIC_ROLES } from '../../theme/contrast-policy.js';
import type { VisualAppearance } from '../test-utils/render.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { lowestRenderedTextContrastAt } from '../test-utils/rendered-contrast.js';
import { setInteractionState } from '../test-utils/surface-colors.js';

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
		const state = specimen.dataset.specimen as (typeof states)[number]['name'];
		setInteractionState(specimen, state);
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

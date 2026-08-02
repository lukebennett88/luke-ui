import { Text } from '@luke-ui/react/text';
import type { TextProps } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import type { JSX } from 'react';
import { useState } from 'react';
import { TextToggleButtonGroup } from './playground/icon-toggle-button-group.js';

type GuideVisibility = 'off' | 'on';
type Step = NonNullable<TextProps['size']>;
type Trim = 'trimmed' | 'untrimmed';

/**
 * The two steps compared side by side. `300` carries the scale's biggest leading-to-size ratio,
 * `900` carries none at all, so trimming either into alignment proves the point regardless of
 * line height.
 */
const COMPARISON_STEPS = ['300', '900'] as const satisfies ReadonlyArray<Step>;

const GUIDE_OPTIONS = [
	{ label: 'Guides on', value: 'on' },
	{ label: 'Guides off', value: 'off' },
] as const satisfies ReadonlyArray<{ label: string; value: GuideVisibility }>;

const TRIM_OPTIONS = [
	{ label: 'Trimmed', value: 'trimmed' },
	{ label: 'Untrimmed', value: 'untrimmed' },
] as const satisfies ReadonlyArray<{ label: string; value: Trim }>;

/** Marks each sample's own box edges. When trimmed, the top and bottom edges are the cap height and baseline. */
const boxEdgeStyle = {
	borderBlock: `1px dashed ${vars.color.border.decorative}`,
} as const;

/** The shared target line. Flexbox's own `align-items: flex-end` puts every sample's box-bottom here. */
const baselineGuideStyle = {
	borderBlockEnd: `2px solid ${vars.color.border.accent}`,
} as const;

/** Toggles Capsize trim and a guide overlay to show two very different size steps share one baseline. */
export function CapsizeTrimExplorer(): JSX.Element {
	const [trim, setTrim] = useState<Trim>('trimmed');
	const [guides, setGuides] = useState<GuideVisibility>('on');

	return (
		<div className="not-prose flex flex-col gap-4">
			<div className="flex flex-wrap items-center gap-3">
				<TextToggleButtonGroup
					label="Trim"
					onChange={setTrim}
					options={TRIM_OPTIONS}
					value={trim}
				/>
				<TextToggleButtonGroup
					label="Baseline guide overlay"
					onChange={setGuides}
					options={GUIDE_OPTIONS}
					value={guides}
				/>
			</div>
			<div className="rounded-xl border border-fd-border p-8">
				<div
					className="flex items-end gap-10"
					style={guides === 'on' ? baselineGuideStyle : undefined}
				>
					{COMPARISON_STEPS.map((step) => (
						<div className="flex flex-col items-center gap-2" key={step}>
							<Text color="secondary" size="100">
								{step}
							</Text>
							<div style={guides === 'on' ? boxEdgeStyle : undefined}>
								<Text elementType="div" shouldDisableTrim={trim === 'untrimmed'} size={step}>
									Aa
								</Text>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

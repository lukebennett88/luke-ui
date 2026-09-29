import { Button } from '@luke-ui/react/button';
import { Checkbox } from '@luke-ui/react/checkbox';
import { Cluster } from '@luke-ui/react/cluster';
import { Heading } from '@luke-ui/react/heading';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { useState } from 'react';

type ColorMode = 'light' | 'dark';

/** Appearance / accessibility preferences. */
export function AppearancePage() {
	const [mode, setMode] = useState<ColorMode>('light');
	const [reduceMotion, setReduceMotion] = useState(false);

	function applyMode(next: ColorMode) {
		setMode(next);
		document.documentElement.dataset.colorMode = next;
	}

	return (
		<Stack gap="sp24">
			<Stack gap="sp8">
				<Heading level={1}>Appearance</Heading>
				<Text color="secondary">
					Document colour mode and motion. Mode is applied on {'<html data-color-mode>'} per the
					current theme contract.
				</Text>
			</Stack>
			<Stack gap="sp8">
				<Text elementType="strong" fontWeight="emphasis" id="color-mode-label">
					Colour mode
				</Text>
				<Cluster aria-labelledby="color-mode-label" gap="sp8" role="group">
					<Button
						aria-pressed={mode === 'light'}
						onPress={() => applyMode('light')}
						prominence={mode === 'light' ? 'high' : 'standard'}
					>
						Light
					</Button>
					<Button
						aria-pressed={mode === 'dark'}
						onPress={() => applyMode('dark')}
						prominence={mode === 'dark' ? 'high' : 'standard'}
					>
						Dark
					</Button>
				</Cluster>
			</Stack>
			<Checkbox isSelected={reduceMotion} onChange={setReduceMotion}>
				Prefer reduced motion
			</Checkbox>
			<Text color="secondary" typography="caption">
				Current mode: {mode}
				{reduceMotion ? ' · reduced motion requested' : ''}
			</Text>
		</Stack>
	);
}

import { Box } from '@luke-ui/react/box';
import { buttonRecipe } from '@luke-ui/react/button';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import type { ComponentProps } from 'react';
import { useId, useState } from 'react';
import type { Selection } from 'react-aria-components/GridList';
import { ToggleButton } from 'react-aria-components/ToggleButton';
import { ToggleButtonGroup } from 'react-aria-components/ToggleButtonGroup';

export default () => {
	const [parentMode, setParentMode] = useState<'light' | 'dark'>('light');
	const labelId = useId();

	return (
		<Box
			backgroundColor="surface.canvas"
			color={vars.color.text.primary}
			data-color-mode={parentMode}
			padding="sp24"
		>
			<Stack gap="sp16">
				<Stack gap="sp8">
					<Text elementType="strong" fontWeight="emphasis" id={labelId}>
						Parent colour mode
					</Text>
					<ToggleButtonGroup
						aria-labelledby={labelId}
						className={GROUP_CLASS_NAME}
						disallowEmptySelection
						onSelectionChange={(selection: Selection) => {
							if (selection === 'all') return;

							const selectedKey = selection.values().next().value;
							if (selectedKey !== 'light' && selectedKey !== 'dark') return;

							setParentMode(selectedKey);
						}}
						orientation="horizontal"
						selectedKeys={[parentMode]}
						selectionMode="single"
					>
						{(['light', 'dark'] as const).map((option) => (
							<ToggleButton
								className={toggleButtonClassName()}
								id={option}
								key={option}
								render={renderToggleButton}
							>
								{option === 'light' ? 'Light' : 'Dark'}
							</ToggleButton>
						))}
					</ToggleButtonGroup>
				</Stack>
				<Box
					backgroundColor="surface.floating"
					borderColor="decorative"
					borderRadius="surface"
					borderStyle="solid"
					borderWidth="thin"
					color={vars.color.text.primary}
					padding="sp16"
				>
					<Text>This panel follows the parent mode.</Text>
				</Box>
				<Box
					backgroundColor="surface.floating"
					borderColor="decorative"
					borderRadius="surface"
					borderStyle="solid"
					borderWidth="thin"
					color={vars.color.text.primary}
					data-color-mode="dark"
					padding="sp16"
				>
					<Text>This panel is fixed to dark mode.</Text>
				</Box>
			</Stack>
		</Box>
	);
};

const GROUP_CLASS_NAME = 'flex items-center gap-2';

function toggleButtonClassName() {
	return buttonRecipe({ prominence: 'standard' });
}

type RenderToggleButton = ComponentProps<typeof ToggleButton>['render'];

const renderToggleButton: RenderToggleButton = (domProps, state) => {
	return <button {...domProps} data-pressed={state.isPressed || state.isSelected || undefined} />;
};

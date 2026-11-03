import { FieldLabel } from '@luke-ui/react/primitives/field';
import {
	RadioControl,
	RadioGroupRoot,
	RadioIndicator,
	RadioLabel,
	RadioRoot,
} from '@luke-ui/react/primitives/radio';
import { Stack } from '@luke-ui/react/stack';

export default () => {
	return (
		<RadioGroupRoot name="alignment">
			<Stack gap="space.8">
				<FieldLabel slot="label">Text alignment</FieldLabel>
				<RadioRoot value="left">
					<RadioLabel>
						<RadioControl>
							<RadioIndicator />
						</RadioControl>
						Left
					</RadioLabel>
				</RadioRoot>
				<RadioRoot value="right">
					<RadioLabel>
						<RadioControl>
							<RadioIndicator />
						</RadioControl>
						Right
					</RadioLabel>
				</RadioRoot>
			</Stack>
		</RadioGroupRoot>
	);
};

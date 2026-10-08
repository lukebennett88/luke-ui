import {
	CheckboxControl,
	CheckboxIndicator,
	CheckboxLabel,
	CheckboxRoot,
} from '@luke-ui/react/primitives/checkbox';
import { InlineField } from '@luke-ui/react/primitives/field';

export default () => {
	return (
		<CheckboxRoot>
			<InlineField description="Example description">
				<CheckboxLabel>
					<CheckboxControl>
						<CheckboxIndicator />
					</CheckboxControl>
					Example checkbox
				</CheckboxLabel>
			</InlineField>
		</CheckboxRoot>
	);
};

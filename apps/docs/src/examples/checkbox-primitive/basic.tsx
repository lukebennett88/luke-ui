import {
	CheckboxContent,
	CheckboxControl,
	CheckboxIndicator,
	CheckboxRoot,
} from '@luke-ui/react/primitives/checkbox';
import { InlineField } from '@luke-ui/react/primitives/field';

export default () => {
	return (
		<CheckboxRoot isInvalid isRequired>
			<InlineField description="Receive updates by email." errorMessage="Choose an option.">
				<CheckboxContent>
					<CheckboxControl>
						<CheckboxIndicator />
					</CheckboxControl>
					Email notifications
				</CheckboxContent>
			</InlineField>
		</CheckboxRoot>
	);
};

import {
	CheckboxContent,
	CheckboxControl,
	CheckboxIndicator,
	CheckboxLabel,
	CheckboxRoot,
} from '@luke-ui/react/primitives/checkbox';

export default () => {
	return (
		<CheckboxRoot>
			<CheckboxContent>
				<CheckboxControl>
					<CheckboxIndicator />
				</CheckboxControl>
				<CheckboxLabel>Example checkbox</CheckboxLabel>
			</CheckboxContent>
		</CheckboxRoot>
	);
};

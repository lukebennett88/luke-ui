import { Field } from '@luke-ui/react/primitives/field';
import {
	SelectIndicator,
	SelectItem,
	SelectListBox,
	SelectPopover,
	SelectRoot,
	SelectTrigger,
	SelectValue,
} from '@luke-ui/react/primitives/select';
import { Stack } from '@luke-ui/react/stack';

export default () => {
	return (
		<Stack gap="sp16" maxInlineSize="20rem">
			<SelectRoot name="country" placeholder="Choose a country">
				<Field description="Choose where you are based." label="Country">
					<SelectTrigger>
						<SelectValue />
						<SelectIndicator />
					</SelectTrigger>
					<SelectPopover>
						<SelectListBox>
							<SelectItem id="au">Australia</SelectItem>
							<SelectItem id="ca">Canada</SelectItem>
							<SelectItem id="nz">New Zealand</SelectItem>
						</SelectListBox>
					</SelectPopover>
				</Field>
			</SelectRoot>
		</Stack>
	);
};

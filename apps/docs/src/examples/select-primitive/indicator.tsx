import { Icon } from '@luke-ui/react/icon';
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
			<SelectRoot aria-label="Sort order" defaultValue="newest">
				<SelectTrigger>
					<SelectValue />
					<SelectIndicator>
						<Icon name="expand" />
					</SelectIndicator>
				</SelectTrigger>
				<SelectPopover>
					<SelectListBox>
						<SelectItem id="newest">Newest first</SelectItem>
						<SelectItem id="oldest">Oldest first</SelectItem>
					</SelectListBox>
				</SelectPopover>
			</SelectRoot>
		</Stack>
	);
};

import { InlineField } from '@luke-ui/react/primitives/field';
import {
	SwitchControl,
	SwitchLabel,
	SwitchRoot,
	SwitchThumb,
} from '@luke-ui/react/primitives/switch';

export default () => {
	return (
		<SwitchRoot>
			<InlineField description="Example description">
				<SwitchLabel>
					<SwitchControl>
						<SwitchThumb />
					</SwitchControl>
					Example switch
				</SwitchLabel>
			</InlineField>
		</SwitchRoot>
	);
};

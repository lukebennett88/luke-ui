import { FieldDescription } from '@luke-ui/react/primitives/field';
import {
	RadioControl,
	RadioGroupRoot,
	RadioIndicator,
	RadioLabel,
	RadioRoot,
} from '@luke-ui/react/primitives/radio';

export default () => {
	return (
		<RadioGroupRoot aria-label="Choose a size" defaultValue="medium">
			{[
				{ label: 'Small', value: 'small' },
				{ description: 'Example description.', label: 'Medium', value: 'medium' },
				{ label: 'Large', value: 'large' },
			].map(({ description, label, value }) => (
				<RadioRoot key={value} value={value}>
					<RadioLabel>
						<RadioControl>
							<RadioIndicator />
						</RadioControl>
						{label}
					</RadioLabel>
					{description != null ? <FieldDescription>{description}</FieldDescription> : null}
				</RadioRoot>
			))}
		</RadioGroupRoot>
	);
};

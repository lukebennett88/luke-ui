import { Box } from '#ui/box';
import { Button } from '#ui/button';
import { ComboboxField, ComboboxItem, ComboboxSection } from '#ui/combobox-field';
import { Text } from '#ui/text';
import { ThemeControls } from './theme-controls.js';

const countries = {
	Oceania: ['Australia', 'Fiji', 'New Zealand', 'Papua New Guinea'],
	Europe: ['France', 'Germany', 'Italy', 'Portugal', 'Spain'],
};

function Countries() {
	return Object.entries(countries).map(([region, names]) => (
		<ComboboxSection key={region} title={region}>
			{names.map((name) => (
				<ComboboxItem id={name} key={name}>
					{name}
				</ComboboxItem>
			))}
		</ComboboxSection>
	));
}

/** A settings-style page that uses every variant family the prototype covers. */
export default function Realistic() {
	return (
		<Box
			display="flex"
			flexDirection="column"
			gap="space.24"
			padding={{ initial: 'space.16', bp768: 'space.32' }}
		>
			<Text elementType="h1" typography="heading1" textWrap="balance">
				Account settings
			</Text>
			<Text elementType="p" color="secondary">
				Change how your workspace looks and who can reach you. Changes apply to every device.
			</Text>
			<ThemeControls />
			<Box
				backgroundColor="surface.raised"
				borderColor="decorative"
				borderRadius="surface"
				borderStyle="solid"
				borderWidth="thin"
				display="flex"
				flexDirection="column"
				gap="space.16"
				padding="space.24"
			>
				<Text elementType="h2" typography="heading3">
					Profile
				</Text>
				<ComboboxField
					data-testid="country"
					description="Used for tax and currency."
					label="Country"
					placeholder="Search countries"
				>
					<Countries />
				</ComboboxField>
				<ComboboxField
					errorMessage="Choose a time zone."
					label="Time zone"
					placeholder="Search time zones"
				>
					<ComboboxItem id="utc">UTC</ComboboxItem>
					<ComboboxItem id="aest">AEST</ComboboxItem>
				</ComboboxField>
				<Box display="flex" flexDirection={{ initial: 'column', bp640: 'row' }} gap="space.16">
					<ComboboxField isDisabled label="Region" placeholder="Disabled" size="small">
						<ComboboxItem id="apac">APAC</ComboboxItem>
					</ComboboxField>
					<ComboboxField defaultSelectedKey="en" isReadOnly label="Language" size="small">
						<ComboboxItem id="en">English</ComboboxItem>
					</ComboboxField>
				</Box>
				<Box display="flex" flexDirection="row" gap="space.8" justifyContent="flex-end">
					<Button prominence="low">Cancel</Button>
					<Button prominence="standard">Preview</Button>
					<Button data-testid="save" prominence="high">
						Save changes
					</Button>
				</Box>
			</Box>
			<Box
				backgroundColor="accent.solid"
				borderRadius="surface"
				display="flex"
				flexDirection="column"
				gap="space.12"
				padding="space.24"
			>
				<Text elementType="h2" typography="heading4">
					Upgrade
				</Text>
				<Text elementType="p">
					Text and low Buttons on a solid surface read its on-solid colour.
				</Text>
				<Box display="flex" gap="space.8">
					<Button data-testid="on-solid-low" prominence="low">
						Learn more
					</Button>
					<Button appearance="text">Compare plans</Button>
				</Box>
			</Box>
			<Box display="flex" flexDirection="column" gap="space.12">
				<Text elementType="h2" typography="heading3">
					Danger zone
				</Text>
				<Text elementType="p" lineClamp={2} typography="caption">
					Deleting the workspace removes every project, member, and integration. This cannot be
					undone, and exported archives are kept for thirty days.
				</Text>
				<Box display="flex" flexDirection={{ initial: 'column', bp640: 'row' }} gap="space.8">
					<Button prominence="low" tone="danger">
						Leave
					</Button>
					<Button size="small" tone="danger">
						Archive
					</Button>
					<Button isDisabled prominence="high" tone="danger">
						Delete workspace
					</Button>
					<Button appearance="text" tone="danger">
						Report a problem
					</Button>
					<Button inlineSize="full" isPending>
						Exporting
					</Button>
				</Box>
				<Text
					fontVariantNumeric="tabular-nums"
					fontWeight="emphasis"
					textTransform="uppercase"
					typography="label"
				>
					12 members · 3 owners
				</Text>
			</Box>
		</Box>
	);
}

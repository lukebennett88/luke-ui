import { Cluster } from '@luke-ui/react/cluster';
import { Text } from '@luke-ui/react/text';
import { useQuery } from '@tanstack/react-query';
import { settingsQueryOptions } from '../api/settings-query.js';
import { ChangeEmailDialog } from '../components/change-email-dialog.js';
import { ProfileAvatarSection } from '../components/profile-avatar-section.js';
import { ProfileTextField } from '../components/profile-text-field.js';
import { SettingsPage, SettingsRow } from '../components/settings-section.js';

export function ProfilePage() {
	const profile = useQuery(settingsQueryOptions).data!.profile;

	return (
		<SettingsPage title="Profile">
			<ProfileAvatarSection profile={profile}>
				<SettingsRow label="Email">
					<Cluster alignItems="center" gap="sp8">
						<Text color="secondary">{profile.email}</Text>
						<ChangeEmailDialog email={profile.email} />
					</Cluster>
				</SettingsRow>
				<ProfileTextField
					field="displayName"
					label="Full name"
					placeholder="Boricio Jones"
					value={profile.displayName}
				/>
				<ProfileTextField
					field="title"
					hint="Your job title or role"
					label="Job title"
					placeholder="Software engineer"
					value={profile.title}
				/>
				<ProfileTextField
					field="username"
					hint="Lowercase letters, numbers and hyphens"
					label="Username"
					placeholder="username"
					value={profile.username}
				/>
			</ProfileAvatarSection>
		</SettingsPage>
	);
}

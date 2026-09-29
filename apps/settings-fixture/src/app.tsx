import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Heading } from '@luke-ui/react/heading';
import { Provider } from '@luke-ui/react/provider';
import spritesheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { rootClassName, vars } from '@luke-ui/react/theme';
import { themeClassName as tactileThemeClassName } from '@luke-ui/react/themes/tactile';
import { useState } from 'react';
import { AccountPage } from './pages/account.js';
import { AppearancePage } from './pages/appearance.js';
import { ProfilePage } from './pages/profile.js';

const NAV = [
	{ id: 'profile', label: 'Public profile' },
	{ id: 'appearance', label: 'Appearance' },
	{ id: 'account', label: 'Account' },
] as const;

type SectionId = (typeof NAV)[number]['id'];

/**
 * Internal settings-style consumer fixture for epic #709 / #713.
 * Uses only public `@luke-ui/react` APIs plus ordinary application markup.
 */
export function App() {
	const [section, setSection] = useState<SectionId>('profile');

	return (
		<Provider spritesheetHref={spritesheetHref}>
			<div className={`${rootClassName} ${tactileThemeClassName}`}>
				<Box
					backgroundColor="surface.canvas"
					display="flex"
					flexDirection={{ initial: 'column', bp768: 'row' }}
					gap="sp32"
					minBlockSize="100dvh"
					padding="sp24"
					style={{ color: vars.color.text.primary }}
				>
					<Stack aria-label="Settings" elementType="nav" gap="sp8" inlineSize={{ bp768: '14rem' }}>
						<Heading level={2}>Settings</Heading>
						{NAV.map((item) => (
							<Button
								key={item.id}
								aria-current={section === item.id ? 'page' : undefined}
								onPress={() => setSection(item.id)}
								prominence={section === item.id ? 'high' : 'low'}
								tone="neutral"
							>
								{item.label}
							</Button>
						))}
						<Text color="secondary" typography="caption">
							Luke UI 1.0 consumer fixture
						</Text>
					</Stack>
					<Box elementType="main" flex="1" maxInlineSize="40rem">
						{section === 'profile' ? <ProfilePage /> : null}
						{section === 'appearance' ? <AppearancePage /> : null}
						{section === 'account' ? <AccountPage /> : null}
					</Box>
				</Box>
			</div>
		</Provider>
	);
}

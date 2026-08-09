import { expect, test } from 'vite-plus/test';
import { componentTestManifest } from './manifest.js';
import type { ComponentTestRegistration } from './registrations.js';

const registrationModules = import.meta.glob<{
	componentTestRegistration?: ComponentTestRegistration;
}>('../*/component-test-registration.ts', { eager: true });
const browserTestModules = import.meta.glob('../*/**/*.browser.test.tsx');

test('registered component contracts match the manifest', () => {
	const expected = componentTestManifest
		.filter((entry) => entry.conformanceTier !== 'none' || entry.integrationTripwire !== 'none')
		.map(({ path, conformanceTier, integrationTripwire }) => ({
			conformanceTier,
			integrationTripwire,
			path,
		}))
		.sort((left, right) => left.path.localeCompare(right.path));

	const registrations = Object.values(registrationModules)
		.map((module) => module.componentTestRegistration)
		.filter((registration): registration is ComponentTestRegistration => registration != null)
		.sort((left, right) => left.path.localeCompare(right.path));

	expect(registrations).toEqual(expected);
	for (const registration of registrations) {
		const componentName = registration.path.split('/').at(-1);
		if (componentName == null) throw new Error(`Invalid component test path: ${registration.path}`);
		const testFile = `../${registration.path}/${componentName}.browser.test.tsx`;
		expect(browserTestModules).toHaveProperty(testFile);
	}
});

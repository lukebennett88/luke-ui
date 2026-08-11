import type { ComponentTestManifestEntry } from './manifest.js';
import { componentTestManifest } from './manifest.js';

export type ComponentTestRegistration = Pick<
	ComponentTestManifestEntry,
	'path' | 'conformanceTier' | 'integrationTripwire'
>;

export function defineComponentTestRegistration(registration: ComponentTestRegistration) {
	const manifestEntry = componentTestManifest.find((entry) => entry.path === registration.path);
	if (manifestEntry == null) throw new Error(`Unknown component test path: ${registration.path}`);
	if (
		manifestEntry.conformanceTier !== registration.conformanceTier ||
		manifestEntry.integrationTripwire !== registration.integrationTripwire
	) {
		throw new Error(
			`Component test registration does not match the manifest: ${registration.path}`,
		);
	}

	return registration;
}

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vite-plus/test';
import { componentTestManifest } from './manifest.js';
import { conformanceRegistrations } from './registrations.js';

test('registers the helpers required by the manifest', () => {
	const missingConformance = componentTestManifest
		.filter((entry) => entry.conformanceTier !== 'none')
		.filter((entry) => {
			const registration =
				entry.conformanceTier === 'field-shaped'
					? conformanceRegistrations['field-shaped']
					: conformanceRegistrations.universal;
			return typeof registration !== 'function';
		});
	expect(missingConformance).toEqual([]);

	const integrationEntries = componentTestManifest.filter(
		(entry) => entry.integrationTripwire === 'required',
	);
	expect(integrationEntries.length).toBeGreaterThan(0);
	expect(conformanceRegistrations.integration).toBeTypeOf('function');
});

test('component tests register every required contract explicitly', () => {
	const missing: Array<string> = [];
	for (const entry of componentTestManifest) {
		if (entry.conformanceTier === 'none' && entry.integrationTripwire === 'none') continue;

		const componentName = entry.path.split('/').at(-1);
		if (componentName == null) throw new Error(`Invalid manifest path: ${entry.path}`);
		const testPath = join(
			import.meta.dirname,
			'..',
			entry.path,
			`${componentName}.browser.test.tsx`,
		);
		if (!existsSync(testPath)) {
			missing.push(`${entry.name}: missing ${componentName}.browser.test.tsx`);
			continue;
		}

		const source = readFileSync(testPath, 'utf8');
		if (entry.conformanceTier !== 'none') {
			const helper =
				entry.conformanceTier === 'field-shaped'
					? 'testFieldShapedConformance'
					: 'testUniversalConformance';
			if (!source.includes(helper)) missing.push(`${entry.name}: missing ${helper} registration`);
		}
		if (entry.integrationTripwire === 'required' && !source.includes('testIntegration(')) {
			missing.push(`${entry.name}: missing testIntegration registration`);
		}
	}

	expect(missing).toEqual([]);
});

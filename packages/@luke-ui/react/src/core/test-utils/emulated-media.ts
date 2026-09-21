export type EmulatedMediaFeatureName =
	| 'forced-colors'
	| 'prefers-color-scheme'
	| 'prefers-reduced-motion';

export type EmulatedMediaFeatures = {
	[K in EmulatedMediaFeatureName]?: string;
};

let currentFeatures: EmulatedMediaFeatures = {};

/** Pure merge: `undefined` removes the feature; otherwise sets it. */
export function mergeEmulatedMediaFeature(
	current: EmulatedMediaFeatures,
	name: EmulatedMediaFeatureName,
	value: string | undefined,
): EmulatedMediaFeatures {
	const next: EmulatedMediaFeatures = { ...current };
	if (value === undefined) {
		delete next[name];
	} else {
		next[name] = value;
	}
	return next;
}

export function toEmulatedMediaFeaturesPayload(features: EmulatedMediaFeatures) {
	return (Object.entries(features) as Array<[EmulatedMediaFeatureName, string]>).map(
		([name, value]) => ({
			name,
			value,
		}),
	);
}

export function peekEmulatedMediaFeatures(): EmulatedMediaFeatures {
	return { ...currentFeatures };
}

/** Updates module state and returns the full feature set to send to CDP. */
export function updateEmulatedMediaFeature(
	name: EmulatedMediaFeatureName,
	value: string | undefined,
): EmulatedMediaFeatures {
	currentFeatures = mergeEmulatedMediaFeature(currentFeatures, name, value);
	return peekEmulatedMediaFeatures();
}

/** Test-only: clear module state between cases. */
export function resetEmulatedMediaFeatures() {
	currentFeatures = {};
}

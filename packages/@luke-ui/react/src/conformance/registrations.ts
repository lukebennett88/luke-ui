import {
	testFieldShapedConformance,
	testIntegration,
	testUniversalConformance,
} from './helpers.js';

export const conformanceRegistrations = {
	'field-shaped': testFieldShapedConformance,
	integration: testIntegration,
	universal: testUniversalConformance,
} as const;

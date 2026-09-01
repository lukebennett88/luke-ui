export const CONFORMANCE_CONTRACTS = ['dom', 'field'] as const;

export type ConformanceContract = (typeof CONFORMANCE_CONTRACTS)[number];

export function formatConformanceList(conformance: ReadonlyArray<ConformanceContract>): string {
	if (conformance.length === 0) return '[]';
	return `[${conformance.map((contract) => `'${contract}'`).join(', ')}]`;
}

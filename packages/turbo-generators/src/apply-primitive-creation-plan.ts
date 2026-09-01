import { applyCreationPlan } from './apply-creation-plan.js';
import type { PrimitiveCreationPlan } from './primitive-creation-plan.js';
import { createPrimitiveWork, parsePrimitiveAnswers } from './primitive-creation-plan.js';

export async function createPrimitive(
	root: string,
	answers: unknown,
): Promise<PrimitiveCreationPlan> {
	const work = createPrimitiveWork(parsePrimitiveAnswers(answers));
	await applyCreationPlan(root, work);
	return { expected: work.expected, files: work.files };
}

import { applyCreationPlan } from './apply-creation-plan.js';
import { createComponentWork, parseComponentAnswers } from './component-creation-plan.js';
import type { ComponentCreationPlan } from './component-creation-plan.js';

export async function createComponent(
	root: string,
	answers: unknown,
): Promise<ComponentCreationPlan> {
	const work = createComponentWork(parseComponentAnswers(answers));
	await applyCreationPlan(root, work);
	return { expected: work.expected, files: work.files };
}

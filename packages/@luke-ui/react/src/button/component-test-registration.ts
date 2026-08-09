import { defineComponentTestRegistration } from '../conformance/registrations.js';

export const componentTestRegistration = defineComponentTestRegistration({
	conformanceTier: 'universal',
	integrationTripwire: 'required',
	path: 'button',
});

import { defineComponentTestRegistration } from '../conformance/registrations.js';

export const componentTestRegistration = defineComponentTestRegistration({
	conformanceTier: 'field-shaped',
	integrationTripwire: 'required',
	path: 'checkbox',
});

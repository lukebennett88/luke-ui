import { Box } from '@luke-ui/react/box';
import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { ComboboxField, ComboboxItem } from '@luke-ui/react/combobox-field';
import { SelectField, SelectItem } from '@luke-ui/react/select-field';
import { SwitchField } from '@luke-ui/react/switch-field';
import { Text } from '@luke-ui/react/text';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance } from '../test-utils/visual.js';

const surfaces = ['surface.base', 'surface.subdued', 'surface.raised'] as const;
const states = ['rest', 'hover', 'pressed', 'focus', 'invalid', 'disabled'] as const;

function FieldSurfacesScene() {
	return (
		<div style={{ display: 'flex', gap: 16, padding: 16, width: 'max-content' }}>
			{surfaces.map((surface) => (
				<Box
					backgroundColor={surface}
					data-scene-surface={surface}
					key={surface}
					padding="space.16"
				>
					<Text>{surface}</Text>
					{states.map((state) => {
						const errorMessage = state === 'invalid' ? 'Choose a valid value.' : undefined;
						const isDisabled = state === 'disabled';
						return (
							<div
								data-scene-state={state}
								key={state}
								style={{ display: 'grid', gap: 12, paddingBlock: 16, width: 280 }}
							>
								<Text fontWeight="emphasis">{state}</Text>
								<TextInputField
									defaultValue="hello@example.com"
									errorMessage={errorMessage}
									isDisabled={isDisabled}
									label="TextInput"
								/>
								<SelectField
									defaultValue="one"
									errorMessage={errorMessage}
									isDisabled={isDisabled}
									label="Select"
								>
									<SelectItem id="one">One</SelectItem>
								</SelectField>
								<ComboboxField
									defaultValue="one"
									errorMessage={errorMessage}
									isDisabled={isDisabled}
									label="Combobox"
								>
									<ComboboxItem id="one">One</ComboboxItem>
								</ComboboxField>
								{[false, true].map((isSelected) => (
									<div key={String(isSelected)} style={{ display: 'flex', gap: 16 }}>
										<CheckboxField
											data-scene-inline-control
											errorMessage={errorMessage}
											isDisabled={isDisabled}
											isSelected={isSelected}
											label={isSelected ? 'Checked' : 'Unchecked'}
										/>
										<SwitchField
											data-scene-inline-control
											errorMessage={errorMessage}
											isDisabled={isDisabled}
											isSelected={isSelected}
											label={isSelected ? 'On' : 'Off'}
										/>
									</div>
								))}
							</div>
						);
					})}
				</Box>
			))}
		</div>
	);
}

for (const appearance of visualAppearances) {
	test(
		`field controls on every surface in ${appearance.theme} ${appearance.mode}`,
		{ tags: ['visual'] },
		async () => {
			const { container, user } = render(<FieldSurfacesScene />, { appearance });
			// Pin recipe states together so one capture shows each boundary against every surface.
			for (const scene of container.querySelectorAll<HTMLElement>('[data-scene-state]')) {
				const state = scene.dataset.sceneState;
				const sceneLocator = page.elementLocator(scene);
				const textInput = sceneLocator.getByRole('textbox', { name: 'TextInput' }).element();
				const select = sceneLocator.getByRole('button', { name: /^One Select$/ }).element();
				const combobox = sceneLocator.getByRole('combobox', { name: 'Combobox' }).element();
				const controls = [
					textInput.closest('[role="group"]') ?? textInput.parentElement,
					select,
					combobox.closest('[role="group"]') ?? combobox.parentElement,
					...(['Unchecked', 'Checked'] as const).map((name) =>
						sceneLocator
							.getByRole('checkbox', { name })
							.element()
							.closest('[data-scene-inline-control]'),
					),
					...(['Off', 'On'] as const).map((name) =>
						sceneLocator
							.getByRole('switch', { name })
							.element()
							.closest('[data-scene-inline-control]'),
					),
				];
				for (const control of controls) {
					if (state === 'hover') control?.setAttribute('data-hovered', 'true');
					if (state === 'pressed') control?.setAttribute('data-pressed', 'true');
					if (state === 'focus') {
						control?.setAttribute('data-focus-visible', 'true');
						control?.setAttribute('data-focus-within', 'true');
					}
				}
			}
			for (const surface of surfaces) {
				const surfaceElement = container.querySelector<HTMLElement>(
					`[data-scene-surface="${surface}"]`,
				);
				const focusScene = surfaceElement?.querySelector<HTMLElement>('[data-scene-state="focus"]');
				if (surfaceElement == null || focusScene == null) {
					throw new Error(`Expected the ${surface} focus scene.`);
				}
				const combobox = page
					.elementLocator(focusScene)
					.getByRole('combobox', { name: 'Combobox' })
					.element();
				combobox.focus({ preventScroll: true });
				// Keep each surface focused only for its own capture; this also closes its menu.
				// oxlint-disable-next-line no-await-in-loop
				await user.keyboard('{Escape}');
				// Each capture resizes the shared viewport.
				// oxlint-disable-next-line no-await-in-loop
				await captureVisualAppearance(
					page.elementLocator(surfaceElement),
					`field-surfaces/${surface.slice('surface.'.length)}`,
					appearance,
				);
			}
		},
	);
}

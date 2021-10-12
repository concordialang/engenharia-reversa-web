import { Feature } from '../../src/spec-analyser/Feature';
import { Scenario } from '../../src/spec-analyser/Scenario';
import { UIElement } from '../../src/spec-analyser/UIElement';
import { Variant } from '../../src/spec-analyser/Variant';
import { VariantSentence } from '../../src/spec-analyser/VariantSentence';

export function assertFeaturesAreEqual(expected: Feature, actual: Feature) {
	expect(actual.getName()).toBe(expected.getName());
	expect(actual.getImports()).toEqual(expected.getImports());
	const expectedScenarios = expected.getScenarios();
	const actualScenarios = actual.getScenarios();
	for (let i = 0; i < expectedScenarios.length; i++) {
		assertScenariosAreEqual(actualScenarios[i], expectedScenarios[i]);
	}

	const expectedUiElements = expected.getUiElements();
	const actualUiElements = actual.getUiElements();
	for (let i = 0; i < expectedUiElements.length; i++) {
		assertUIElementsAreEqual(actualUiElements[i], expectedUiElements[i]);
	}
}

export function assertScenariosAreEqual(expected: Scenario, actual: Scenario) {
	expect(actual.getName()).toBe(expected.getName());
	const expectedVariants = expected.getVariants();
	const actualVariants = actual.getVariants();
	for (let i = 0; i < expectedVariants.length; i++) {
		assertVariantsAreEqual(actualVariants[i], expectedVariants[i]);
	}
}

export function assertVariantsAreEqual(expected: Variant, actual: Variant) {
	expect(actual.getName()).toBe(expected.getName());
	expect(actual.last).toBe(expected.last);

	const expectedVariantSentences = expected.getSentences();
	const actualVariantSentences = actual.getSentences();

	assertVariantSentencesAreEqual(expectedVariantSentences[0], actualVariantSentences[0]);
}

export function assertVariantSentencesAreEqual(expected: VariantSentence, actual: VariantSentence) {
	expect(actual.type).toBe(expected.type);
	expect(actual.action).toBe(expected.action);
	expect(actual.attributtes).toStrictEqual(expected.attributtes);
	expect(actual.url).not.toBeUndefined();
	if (actual.url && expected.url) {
		expect(actual.url.href).toBe(expected.url.href);
	}
	expect(actual.statePostCondition).toBe(expected.statePostCondition);
	expect(actual.uiElement).not.toBeUndefined();
	if (actual.uiElement && expected.uiElement) {
		assertUIElementsAreEqual(expected.uiElement, actual.uiElement);
	}
}

export function assertUIElementsAreEqual(expected: UIElement, actual: UIElement) {
	expect(actual.getName()).toBe(expected.getName());
	expect(actual.getProperties()).toStrictEqual(expected.getProperties());
	expect(actual.getSourceElement()).toBe(expected.getSourceElement());
}

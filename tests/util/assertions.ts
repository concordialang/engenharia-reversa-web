import { Feature } from '../../src/content-script/spec-analyser/Feature';
import { Scenario } from '../../src/content-script/spec-analyser/Scenario';
import { UIElement } from '../../src/content-script/spec-analyser/UIElement';
import { Variant } from '../../src/content-script/spec-analyser/Variant';
import { VariantSentence } from '../../src/content-script/spec-analyser/VariantSentence';
import { ElementInteraction } from '../../src/content-script/crawler/ElementInteraction';
import { ElementAnalysis } from '../../src/content-script/crawler/ElementAnalysis';
import { Spec } from '../../src/content-script/spec-analyser/Spec';

export function assertElementAnalysisAreEqual(expected: ElementAnalysis, actual: ElementAnalysis) {
	expect(actual.getElement()).toBe(expected.getElement());
	expect(actual.getPageUrl().href).toBe(expected.getPageUrl().href);
	expect(actual.getStatus()).toBe(expected.getStatus());
}

export function assertElementInteractionsAreEqual(
	expected: ElementInteraction<HTMLElement>,
	actual: ElementInteraction<HTMLElement>
) {
	expect(actual.getElement()).toBe(expected.getElement());
	expect(actual.getEventType()).toBe(expected.getEventType());
	expect(actual.getPageUrl().href).toBe(expected.getPageUrl().href);
	expect(actual.getValue()).toBe(expected.getValue());
	expect(actual.getId()).toBe(expected.getId());
	expect(actual.getElementSelector()).toBe(expected.getElementSelector());
	const expectedVariant = expected.getVariant();
	const actualVariant = actual.getVariant();
	expect(actualVariant).not.toBeNull();
	if (actualVariant instanceof Variant && expectedVariant instanceof Variant) {
		assertVariantsAreEqual(expectedVariant, actualVariant);
	}

	const expectedFeature = expected.getFeature();
	const actualFeature = actual.getFeature();
	expect(actualFeature).not.toBeNull();
	if (actualFeature instanceof Feature && expectedFeature instanceof Feature) {
		assertFeaturesAreEqual(expectedFeature, actualFeature);
	} else if (typeof actualFeature === 'string' && typeof expectedFeature === 'string') {
		expect(actualFeature).toBe(expectedFeature);
	} else {
		fail('Feature must be a string or Feature object');
	}
}

export function assertFeaturesAreEqual(expected: Feature, actual: Feature) {
	expect(actual.getName()).toBe(expected.getName());
	expect(actual.getImports()).toEqual(expected.getImports());
	expect(actual.getId()).toEqual(expected.getId());
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

export function assertSpecsAreEqual(expected: Spec, actual: Spec) {
	expect(actual.language).toBe(expected.language);
	const expectedFeatures = expected.getFeatures();
	const actualFeatures = actual.getFeatures();
	for (let i = 0; i < expectedFeatures.length; i++) {
		assertFeaturesAreEqual(actualFeatures[i], expectedFeatures[i]);
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

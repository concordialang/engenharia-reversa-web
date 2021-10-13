import { UIElement } from '../../src/spec-analyser/UIElement';
import { UIProperty } from '../../src/spec-analyser/UIProperty';
import { Variant } from '../../src/spec-analyser/Variant';
import { Scenario } from '../../src/spec-analyser/Scenario';
import { Feature } from '../../src/spec-analyser/Feature';
import { VariantSentence } from '../../src/spec-analyser/VariantSentence';
import { Import } from '../../src/spec-analyser/Import';

export function createValidFeature(): Feature {
	const feature = new Feature();
	feature.setName('A Feature');

	const import1 = new Import('file.txt');
	const import2 = new Import('file2.txt');
	feature.setImports([import1, import2]);

	const element1 = createElement(document, 'div');
	const uiElement1 = createValidUIElement(element1, 'UI Element 1');

	const element2 = createElement(document, 'span');
	const uiElement2 = createValidUIElement(element2, 'UI Element 2');

	feature.setUiElements([uiElement1, uiElement2]);

	const variant1 = createValidVariant(uiElement1);
	const variant2 = createValidVariant(uiElement2);

	const scenario = createValidScenario([variant1, variant2]);
	feature.addScenario(scenario);

	return feature;
}

export function createValidScenario(variants: Variant[]): Scenario {
	const scenario = new Scenario();
	scenario.setName('A Scenario');
	scenario.setVariants(variants);
	return scenario;
}

export function createValidVariant(uiElement: UIElement): Variant {
	const sentence = new VariantSentence(
		'type 1',
		'action 1',
		uiElement,
		[{ property: 'property 1', value: 'value 1' }],
		new URL('https://www.google.com'),
		'state 1'
	);

	const variant = new Variant();
	variant.setName('variant 1');
	variant.setVariantSentence(sentence);
	variant.last = true;

	return variant;
}

export function createValidUIElement(element: HTMLElement, name?: string): UIElement {
	const uiProperty = new UIProperty('property 1', 'property value');
	const uiElement = new UIElement(element);
	uiElement.setName(name ?? 'UI Element 1');
	uiElement.setProperty(uiProperty);
	return uiElement;
}

export function createElement(
	document: HTMLDocument,
	tagName: string,
	elementCustomizationCallback?: (element: HTMLElement) => void
): HTMLElement {
	const element = document.createElement(tagName);
	if (elementCustomizationCallback) {
		elementCustomizationCallback(element);
	}
	document.body.appendChild(element);
	return element;
}

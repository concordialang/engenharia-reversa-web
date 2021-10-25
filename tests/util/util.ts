import { UIElement } from '../../src/content-script/spec-analyser/UIElement';
import { UIProperty } from '../../src/content-script/spec-analyser/UIProperty';
import { Variant } from '../../src/content-script/spec-analyser/Variant';
import { Scenario } from '../../src/content-script/spec-analyser/Scenario';
import { Feature } from '../../src/content-script/spec-analyser/Feature';
import { VariantSentence } from '../../src/content-script/spec-analyser/VariantSentence';
import { Import } from '../../src/content-script/spec-analyser/Import';
import { ElementInteraction } from '../../src/content-script/crawler/ElementInteraction';
import { HTMLEventType } from '../../src/content-script/enums/HTMLEventType';
import { ElementAnalysis } from '../../src/content-script/crawler/ElementAnalysis';
import { ElementAnalysisStatus } from '../../src/content-script/crawler/ElementAnalysisStatus';

export function createValidElementAnalysis(element?: HTMLElement): ElementAnalysis {
	if (!element) {
		element = createElement(document, 'input');
	}

	return new ElementAnalysis(
		element,
		new URL('https://www.google.com'),
		ElementAnalysisStatus.Done
	);
}

export function createValidElementInteraction(
	element?: HTMLElement
): ElementInteraction<HTMLElement> {
	if (!element) {
		element = createElement(document, 'input');
	}

	const variant = createValidVariant(createValidUIElement(element));

	return new ElementInteraction<HTMLElement>(
		element,
		HTMLEventType.Change,
		new URL('https://www.google.com'),
		'A Value',
		null,
		'selector',
		variant
	);
}

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
	const scenario = new Scenario('A Scenario');
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

import { Feature } from '../spec-analyser/Feature';
import { Scenario } from '../spec-analyser/Scenario';
import { Variant } from '../spec-analyser/Variant';
import { VariantSentence } from '../spec-analyser/VariantSentence';
import { VariantSentenceType } from '../types/VariantSentenceType';
import { UIElement } from '../spec-analyser/UIElement';
import { UIProperty } from '../spec-analyser/UIProperty';
import { getEnumKeyByEnumValue } from '../util';
import { LocalObjectStorage } from './LocalObjectStorage';

export class FeatureStorage extends LocalObjectStorage<Feature> {
	protected stringifyObject(obj: Feature): string {
		return JSON.stringify(obj);
	}

	protected mapJsonToObject(json: {}): Feature {
		const feature = new Feature();
		feature.setName(json['name']);
		for (const scenario of json['scenarios']) {
			feature.addScenario(this.createScenario(scenario));
		}
		for (const uiElement of json['uiElements']) {
			feature.addUiElement(this.createUiElement(uiElement));
		}
		return feature;
	}

	private createScenario(json: object): Scenario {
		const scenario = new Scenario();
		scenario.setName(json['name']);
		for (const variant of json['variants']) {
			scenario.addVariant(this.createVariant(variant));
		}
		return scenario;
	}

	private createVariant(json: object): Variant {
		const variant = new Variant();
		variant.setName(json['name']);
		for (const sentence of json['sentences']) {
			variant.setVariantSentence(this.createVariantSentence(sentence));
		}
		return variant;
	}

	private createVariantSentence(json: object): VariantSentence {
		const type: VariantSentenceType = getEnumKeyByEnumValue(VariantSentenceType, json['type']);
		const sentence: VariantSentence = new VariantSentence(
			type,
			json['action'],
			json['targets']
		);
		return sentence;
	}

	private createUiElement(json: object): UIElement {
		const uiElement = new UIElement();
		uiElement.setName(json['name']);
		for (const property of json['properties']) {
			uiElement.setProperty(this.createUiProperty(property));
		}
		return uiElement;
	}

	private createUiProperty(json: object): UIProperty {
		const uiProperty = new UIProperty(json['name'], json['value']);
		return uiProperty;
	}
}

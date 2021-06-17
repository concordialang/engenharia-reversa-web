import { Feature } from '../feature/Feature';
import { Scenario } from '../feature/Scenario';
import { Variant } from '../feature/Variant';
import { VariantSentence } from '../feature/VariantSentence';
import { VariantSentenceType } from '../types/VariantSentenceType';
import { UIElement } from '../feature/UIElement';
import { UIProperty } from '../feature/UIProperty';

function getEnumKeyByEnumValue(myEnum, enumValue) {
	let keys = Object.keys(myEnum).filter((x) => myEnum[x] == enumValue);
	return keys.length > 0 ? myEnum[keys[0]] : null;
}

export class FeatureStorage {
	public save(key: string, feature: Feature): void {
		window.localStorage.setItem(key, JSON.stringify(feature));
	}

	public get(key: string): Feature | null {
		const item: string | null = window.localStorage.getItem(key);
		if (item && item.length !== 0 && item.trim()) {
			const json: object = JSON.parse(item);
			const feature = this.createFeature(json);
			return feature;
		}
		return null;
	}

	public remove(key: string): void {
		window.localStorage.removeItem(key);
	}

	//criar interface serializable e colocar esses métodos nas classes respectivas

	private createFeature(json: object): Feature {
		const feature = new Feature();
		feature.setName(json['name']);
		for (const scenario of json['scenarios']) {
			feature.addScenario(this.createScenario(scenario));
		}
		for (const uiElement of json['uiElements']) {
			feature.setUiElement(this.createUiElement(uiElement));
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

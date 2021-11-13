import { LocalObjectStorage } from './LocalObjectStorage';
import { ElementInteraction } from '../crawler/ElementInteraction';
import { Feature } from '../spec-analyser/Feature';
import { ObjectStorage } from './ObjectStorage';

// TODO Trocar o nome da classe
export class ElementInteractionStorage extends LocalObjectStorage<ElementInteraction<HTMLElement>> {
	constructor(localStorage: Storage, private featureStorage: ObjectStorage<Feature>) {
		super(localStorage, ElementInteraction);
	}

	async set(key: string, obj: ElementInteraction<HTMLElement>): Promise<void> {
		const feature = obj.getFeature();
		if (feature instanceof Feature) {
			const featureId = feature.getId();
			obj.setFeature(featureId);
		}
		await super.set(key, obj);
		obj.setFeature(feature);
	}

	async get(key: string): Promise<ElementInteraction<HTMLElement> | null> {
		const elementInteraction = await super.get(key);
		if (!elementInteraction) {
			return null;
		}
		let feature = elementInteraction.getFeature();
		if (typeof feature === 'string') {
			feature = await this.featureStorage.get(feature);
			elementInteraction.setFeature(feature);
		}
		return elementInteraction;
	}
}

import { LocalObjectStorage } from './LocalObjectStorage';
import { ElementInteraction } from '../crawler/ElementInteraction';
import { Feature } from '../spec-analyser/Feature';
import { ObjectStorage } from './ObjectStorage';
import { Variant } from '../spec-analyser/Variant';
import { InMemoryStorage } from './InMemoryStorage';
import { CommunicationChannel } from '../../shared/comm/CommunicationChannel';
import { BackgroundIndexedDBObjectStorage } from './BackgroundIndexedDBObjectStorage';
import { IndexedDBDatabases } from '../../shared/storage/IndexedDBDatabases';
import { Command } from '../../shared/comm/Command';

// TODO Trocar o nome da classe
export class ElementInteractionStorage extends BackgroundIndexedDBObjectStorage<ElementInteraction<HTMLElement>> {
	constructor(
		communicationChannel: CommunicationChannel,
		private featureStorage: ObjectStorage<Feature>,
		private variantStorage: ObjectStorage<Variant>
	) {
		super(
			IndexedDBDatabases.ElementInteractions, 
			IndexedDBDatabases.ElementInteractions, 
			communicationChannel, 
			ElementInteraction, 
			Command.GetInteractionFromBackgroundIndexedDB
		);
	}

	async set(key: string, obj: ElementInteraction<HTMLElement>): Promise<void> {
		const feature = obj.getFeature();
		if (feature instanceof Feature) {
			const featureId = feature.getId();
			obj.setFeature(featureId);
		}
		const variant = obj.getVariant();
		if (variant instanceof Variant) {
			const variantId = variant.getId();
			obj.setVariant(variantId);
		}
		await super.set(key, obj);
		obj.setFeature(feature);
		obj.setVariant(variant);
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
		let variant = elementInteraction.getVariant();
		if (typeof variant === 'string') {
			variant = await this.variantStorage.get(variant);
			elementInteraction.setVariant(variant);
		}
		return elementInteraction;
	}
}

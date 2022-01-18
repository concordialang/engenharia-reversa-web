import { InMemoryStorage } from './InMemoryStorage';
import { CommunicationChannel } from '../../shared/comm/CommunicationChannel';
import { InMemoryDatabase } from '../extension/InMemoryDatabase';
import { ElementInteraction } from '../../content-script/crawler/ElementInteraction';
import { ObjectStorage } from '../../shared/storage/ObjectStorage';
import { Variant } from '../../content-script/spec-analyser/Variant';
import { Feature } from '../../content-script/spec-analyser/Feature';
import { plainToClass } from 'class-transformer';

// TODO Trocar o nome da classe
export class ElementInteractionStorage extends InMemoryStorage<ElementInteraction<HTMLElement>> {
	constructor(
		inMemoryDatabase: InMemoryDatabase,
		private featureStorage: ObjectStorage<Feature>,
		private variantStorage: ObjectStorage<Variant>
	) {
		super(inMemoryDatabase);
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
		console.log("123123123");
		const elementInteraction = plainToClass(ElementInteraction, await super.get(key));
		console.log(elementInteraction);
		console.log("sadsdasadsad123123");
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

import { ElementInteraction } from '../../content-script/crawler/ElementInteraction';
import { ObjectStorage } from '../../shared/storage/ObjectStorage';
import { Variant } from '../../content-script/spec-analyser/Variant';
import { plainToClass } from 'class-transformer';
import { Feature } from '../extension/Feature';
import { IndexedDBObjectStorage } from '../../shared/storage/IndexedDBObjectStorage';
import { IndexedDBDatabases } from '../../shared/storage/IndexedDBDatabases';

export class ElementInteractionStorage extends IndexedDBObjectStorage<ElementInteraction<HTMLElement>> {
	constructor(
		private featureStorage: ObjectStorage<Feature>,
		private variantStorage: ObjectStorage<Variant>
	) {
		super(IndexedDBDatabases.ElementInteractions, IndexedDBDatabases.ElementInteractions, ElementInteraction);
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
		let elementInteraction = await super.get(key);
		if (!elementInteraction) {
			return null;
		}
		if(!(elementInteraction instanceof ElementInteraction)) {
			//@ts-ignore
			elementInteraction = plainToClass(ElementInteraction, elementInteraction);
		}
		//@ts-ignore
		let feature = elementInteraction.getFeature();
		if (typeof feature === 'string') {
			//@ts-ignore
			feature = await this.featureStorage.get(feature);
			//@ts-ignore
			elementInteraction.setFeature(feature);
		} else if(feature) {
			if(feature.constructor.name != "Feature"){
				//@ts-ignore
				feature = plainToClass(Feature, feature);
			}
			//@ts-ignore
			feature = await this.featureStorage.get(feature.getId());
			if(elementInteraction){
				elementInteraction.setFeature(feature);
			}
		}
		//@ts-ignore
		let variant = elementInteraction.getVariant();
		if (typeof variant === 'string') {
			variant = await this.variantStorage.get(variant);
			//@ts-ignore
			elementInteraction.setVariant(variant);
		} else if(variant) {
			if(variant.constructor.name != "Variant"){
				//@ts-ignore
				variant = plainToClass(Variant, variant);
			}
			//@ts-ignore
			variant = await this.variantStorage.get(variant.getId());
			if(elementInteraction){
				elementInteraction.setVariant(variant);
			}
		}
		return elementInteraction;
	}
}

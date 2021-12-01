import { Exclude, Type } from 'class-transformer';
import { ObjectStorage } from '../storage/ObjectStorage';
import { Feature } from './Feature';

export class Spec {
	@Type(() => Feature)
	private features: Array<Feature> = [];

	@Exclude()
	private featureStorage: ObjectStorage<Feature> | null = null;

	constructor(
		public readonly language: string,
		featureStorage: ObjectStorage<Feature> | null = null
	) {
		this.featureStorage = featureStorage;
	}

	public addFeature(feature: Feature) {
		const index = this.features.findIndex((f) => f.getId() === feature.getId());
		if (index > -1) {
			this.features[index] = feature;
		} else {
			let featureName = feature.getName();
			let featureScenarios = feature.getScenarios();
			let featureVariants = featureScenarios[0].getVariants();

			if (featureName && featureScenarios.length > 0 && featureVariants.length > 0) {
				this.features.push(feature);
			}
		}
		if (this.featureStorage) {
			this.featureStorage.set(feature.getId(), feature);
		}
	}

	public setFeatureStorage(featureStorage: ObjectStorage<Feature>): void {
		this.featureStorage = featureStorage;
	}

	public getFeatures() {
		return this.features;
	}

	public featureCount() {
		return this.features.length;
	}
}

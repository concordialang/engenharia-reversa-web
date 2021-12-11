import { Exclude, Type } from 'class-transformer';
import { ObjectStorage } from '../storage/ObjectStorage';
import { Feature } from './Feature';

export class Spec {
	@Type(() => Feature)
	private features: Array<Feature> = [];

	@Exclude()
	private featureStorage: ObjectStorage<Feature> | null = null;

	@Exclude()
	private specStorage: ObjectStorage<Spec> | null = null;

	constructor(
		public readonly language: string,
		featureStorage: ObjectStorage<Feature> | null = null,
		specStorage: ObjectStorage<Spec> | null = null
	) {
		this.featureStorage = featureStorage;
		this.specStorage = specStorage;
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
		if (this.specStorage) {
			this.specStorage.set(Spec.getStorageKey(), this);
		}
	}

	public setFeatureStorage(featureStorage: ObjectStorage<Feature>): void {
		this.featureStorage = featureStorage;
	}

	public setSpecStorage(specStorage: ObjectStorage<Spec>): void {
		this.specStorage = specStorage;
	}

	public getFeatures() {
		return this.features;
	}

	public featureCount() {
		return this.features.length;
	}

	public setFeatures(features: Feature[]) {
		this.features = features;
	}

	public static getStorageKey(): string {
		return 'Spec';
	}
}

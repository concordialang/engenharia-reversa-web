import { Exclude, Type } from 'class-transformer';
import Mutex from '../../content-script/mutex/Mutex';
import { ObjectStorage } from '../../shared/storage/ObjectStorage';
import { Feature } from './Feature';

export class Spec {
	@Type(() => Feature)
	private features: Array<Feature> = [];

	@Exclude()
	private featureStorage: ObjectStorage<Feature> | null = null;

	@Exclude()
	private specStorage: ObjectStorage<Spec> | null = null;

	@Exclude()
	private mutex: Mutex | null = null;

	constructor(
		public readonly language: string,
		featureStorage: ObjectStorage<Feature> | null = null,
		specStorage: ObjectStorage<Spec> | null = null,
		mutex: Mutex | null = null
	) {
		this.featureStorage = featureStorage;
		this.specStorage = specStorage;
		this.mutex = mutex;
	}

	public async addFeature(feature: Feature): Promise<void> {
		if (this.mutex) {
			await this.mutex.lock();
		}
		const features = await this.getFeaturesFromStorage();
		if (features) {
			this.features = features;
		}

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

		if (this.mutex) {
			await this.mutex.unlock();
		}
	}

	public setFeatureStorage(featureStorage: ObjectStorage<Feature>): void {
		this.featureStorage = featureStorage;
	}

	public setSpecStorage(specStorage: ObjectStorage<Spec>): void {
		this.specStorage = specStorage;
	}

	public setMutex(mutex: Mutex): void {
		this.mutex = mutex;
	}

	public getFeatures() {
		return this.features;
	}

	public featureCount() {
		return this.features.length;
	}

	public static getStorageKey(): string {
		return 'Spec';
	}

	private async getFeaturesFromStorage(): Promise<Feature[] | null> {
		if (this.specStorage) {
			const latestVersionOfSpec = await this.specStorage.get(Spec.getStorageKey());
			if (latestVersionOfSpec) {
				return latestVersionOfSpec.getFeatures();
			}
			return [];
		}
		return null;
	}
}

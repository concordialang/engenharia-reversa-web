import { Feature } from './Feature';

export class Spec {
	private features: Array<Feature> = [];

	constructor(public readonly language: string) {}

	public addFeature(feature: Feature) {
		this.features.push(feature);
	}

	public getFeatures() {
		return this.features;
	}
}
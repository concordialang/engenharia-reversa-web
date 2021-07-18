import { Feature } from './Feature';

export class Spec {
	private features: Array<Feature> = [];

	constructor(public readonly language: string) {}

	public addFeature(feature: Feature) {
		this.features.push(feature);
	}

	public addFeatures(features: Feature[]) {
		features.forEach((feature) => {
			let featureName = feature.getName();
			let featureScenarios = feature.getScenarios();
			let featureVariants = featureScenarios[0].getVariants();

			if (featureName && featureScenarios.length > 0 && featureVariants.length > 0) {
				this.features.push(feature);
			}
		});
	}

	public getFeatures() {
		return this.features;
	}
}

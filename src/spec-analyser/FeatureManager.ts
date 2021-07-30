import { AnalyzedElement } from '../crawler/AnalyzedElement';
import { ElementInteraction } from '../crawler/ElementInteraction';
import { AnalyzedElementStorage } from '../storage/AnalyzedElementStorage';
import { Feature } from './Feature';
import { FeatureUtil } from './FeatureUtil';
import { Spec } from './Spec';
import { VariantGenerator } from './VariantGenerator';

export class FeatureManager {
	constructor(
		private variantGenerator: VariantGenerator,
		private featureUtil: FeatureUtil,
		private analyzedElementStorage: AnalyzedElementStorage,
		private spec: Spec
	) {}

	redirectionCallback = async (interaction: ElementInteraction<HTMLElement>) => {
		const analyzedElement = new AnalyzedElement(
			interaction.getElement(),
			interaction.getPageUrl()
		);
		await this.analyzedElementStorage.set(analyzedElement.getId(), analyzedElement);
	};

	public async generateFeature(
		analysisElement: HTMLElement,
		url: URL,
		ignoreElementsInsideFeatureTags: boolean = false
	): Promise<Feature | null> {
		const feature = this.featureUtil.createFeatureFromElement(
			analysisElement,
			this.spec.featureCount()
		);
		const scenario = this.featureUtil.createScenario(feature);
		const variants = await this.variantGenerator.generate(
			analysisElement,
			url,
			ignoreElementsInsideFeatureTags,
			this.redirectionCallback
		);

		if (variants.length == 0) {
			return null;
		}

		scenario.setVariants(variants);
		feature.addScenario(scenario);

		return feature;
	}
}

import { AnalyzedElement } from '../crawler/AnalyzedElement';
import { ElementInteraction } from '../crawler/ElementInteraction';
import { MutationObserverManager } from '../mutation-observer/MutationObserverManager';
import { AnalyzedElementStorage } from '../storage/AnalyzedElementStorage';
import { Feature } from './Feature';
import { FeatureUtil } from './FeatureUtil';
import { Spec } from './Spec';
import { Variant } from './Variant';
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
		ignoreFeatureTags: boolean = false
	): Promise<Feature | null> {
		const feature = this.featureUtil.createFeatureFromElement(
			analysisElement,
			this.spec.featureCount()
		);
		const scenario = this.featureUtil.createScenario(feature);
		let observer: MutationObserverManager = new MutationObserverManager(analysisElement);

		let variant: Variant | null;
		do {
			variant = await this.variantGenerator.generate(
				analysisElement,
				observer,
				ignoreFeatureTags,
				this.redirectionCallback
			);

			if (variant && variant.getSentences().length > 0) {
				scenario.addVariant(variant);
			}
		} while (variant && !variant.last);

		observer.disconnect();

		feature.addScenario(scenario);

		return feature;
	}
}

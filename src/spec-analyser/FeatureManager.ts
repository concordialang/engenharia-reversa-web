import { AnalyzedElement } from '../crawler/AnalyzedElement';
import { ElementInteraction } from '../crawler/ElementInteraction';
import { MutationObserverManager } from '../mutation-observer/MutationObserverManager';
import { AnalyzedElementStorage } from '../storage/AnalyzedElementStorage';
import { Feature } from './Feature';
import { FeatureUtil } from './FeatureUtil';
import { Spec } from './Spec';
import { UIElement } from './UIElement';
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
		url: URL,
		ignoreFeatureTags: boolean = false
	): Promise<Feature | null> {
		const feature = this.featureUtil.createFeatureFromElement(
			analysisElement,
			this.spec.featureCount()
		);
		let observer: MutationObserverManager = new MutationObserverManager(analysisElement);

		let variants: Variant[] = [];
		let variantAnalyzed: Variant | null;

		do {
			variantAnalyzed = await this.variantGenerator.generate(
				analysisElement,
				url,
				observer,
				ignoreFeatureTags,
				feature.getName(),
				variants.length,
				this.redirectionCallback
			);

			if (variantAnalyzed && variantAnalyzed.isValid()) {
				variants.push(variantAnalyzed);
			}
		} while (variantAnalyzed && !variantAnalyzed.last);

		observer.disconnect();

		if (variants.length == 0) {
			return null;
		}

		const scenario = this.featureUtil.createScenario(feature.getName());
		scenario.setVariants(variants);
		feature.addScenario(scenario);

		const uiElements: Array<UIElement> = this.getUniqueUIElements(variants);
		feature.setUiElements(uiElements);

		return feature;
	}

	private getUniqueUIElements(variants: Variant[]): Array<UIElement> {
		let allUIElements: Array<UIElement> = [];

		for (let variant of variants) {
			variant.getSentences().forEach((sentence) => {
				if (sentence.uiElement) {
					allUIElements.push(sentence.uiElement);
				}
			});
		}

		let uniqueUIElementsNames = [...new Set(allUIElements.map((uie) => uie.getName()))];

		let uniqueUIElements: Array<UIElement> = [];

		for (let nameUI of uniqueUIElementsNames) {
			let uniqueUIElm = allUIElements.find((uiElm) => uiElm.getName() === nameUI);

			if (uniqueUIElm) {
				uniqueUIElements.push(uniqueUIElm);
			}
		}

		return uniqueUIElements;
	}
}

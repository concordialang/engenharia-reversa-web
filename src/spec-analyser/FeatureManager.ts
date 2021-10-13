import { ElementAnalysis } from '../crawler/ElementAnalysis';
import { ElementAnalysisStatus } from '../crawler/ElementAnalysisStatus';
import { ElementInteraction } from '../crawler/ElementInteraction';
import { MutationObserverManager } from '../mutation-observer/MutationObserverManager';
import { ElementAnalysisStorage } from '../storage/ElementAnalysisStorage';
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
		private elementAnalysisStorage: ElementAnalysisStorage,
		private spec: Spec
	) {}

	redirectionCallback = async (interaction: ElementInteraction<HTMLElement>) => {
		const elementAnalysis = new ElementAnalysis(
			interaction.getElement(),
			interaction.getPageUrl(),
			ElementAnalysisStatus.Done
		);
		await this.elementAnalysisStorage.set(elementAnalysis.getId(), elementAnalysis);
	};

	public async generateFeature(
		analysisElement: HTMLElement,
		url: URL,
		ignoreFormElements: boolean = false
	): Promise<Feature | null> {
		const feature = this.featureUtil.createFeatureFromElement(
			analysisElement,
			this.spec.featureCount()
		);
		let observer: MutationObserverManager = new MutationObserverManager(
			analysisElement.ownerDocument.body
		);

		let variants: Variant[] = [];
		let variantAnalyzed: Variant | null;
		// let interactionCount: Array<{ xpath: string; count: number }> = [];

		do {
			variantAnalyzed = await this.variantGenerator.generate(
				analysisElement,
				url,
				observer,
				ignoreFormElements,
				feature,
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
			let UiElementsOfName = allUIElements.filter((uiElm) => uiElm.getName() === nameUI);

			if (UiElementsOfName.length == 0) {
				continue;
			}

			let uniqueUIElm: UIElement = UiElementsOfName[0];

			if (UiElementsOfName.length > 1) {
				uniqueUIElm = UiElementsOfName.reduce((uiElmWithMoreProperties, uiElm) => {
					return uiElm.getProperties().length >
						uiElmWithMoreProperties.getProperties().length
						? uiElm
						: uiElmWithMoreProperties;
				}, uniqueUIElm);
			}

			uniqueUIElements.push(uniqueUIElm);
		}

		return uniqueUIElements;
	}
}

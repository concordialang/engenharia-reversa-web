import { ElementAnalysis } from '../crawler/ElementAnalysis';
import { ElementAnalysisStatus } from '../crawler/ElementAnalysisStatus';
import { ElementInteraction } from '../crawler/ElementInteraction';
import { MutationObserverManager } from '../mutation-observer/MutationObserverManager';
import { ElementAnalysisStorage } from '../storage/ElementAnalysisStorage';
import { LocalObjectStorage } from '../storage/LocalObjectStorage';
import { getPathTo } from '../util';
import { Feature } from './Feature';
import { FeatureUtil } from './FeatureUtil';
import { Scenario } from './Scenario';
import { Spec } from './Spec';
import { UIElement } from './UIElement';
import { Variant } from './Variant';
import { VariantGenerator } from './VariantGenerator';

const limitsOfVariants = 30;

export class FeatureManager {
	constructor(
		private variantGenerator: VariantGenerator,
		private featureUtil: FeatureUtil,
		private elementAnalysisStorage: ElementAnalysisStorage,
		private spec: Spec
	) {}

	public async generateFeature(
		analysisElement: HTMLElement,
		url: URL,
		ignoreFormElements: boolean = false,
		redirectionCallback?: (
			interactionThatTriggeredRedirect: ElementInteraction<HTMLElement>,
			variant: Variant,
			feature: Feature
		) => Promise<void>,
		feature: Feature | null = null,
		previousInteractions: Array<ElementInteraction<HTMLElement>> = []
	): Promise<Feature | null> {
		if (!feature) {
			feature = this.featureUtil.createFeatureFromElement(
				analysisElement,
				this.spec.featureCount()
			);
		}

		feature.ignoreFormElements = ignoreFormElements;

		const scenario = feature.getGeneralScenario();
		const maxVariantCount: number = this.discoverElementMaxVariantCount(
			analysisElement,
			feature.ignoreFormElements
		);
		feature.setMaxVariantCount(maxVariantCount);

		let observer: MutationObserverManager = new MutationObserverManager(
			analysisElement.ownerDocument.body
		);

		const callback = async (
			interactionThatTriggeredRedirect: ElementInteraction<HTMLElement>,
			newVariant: Variant
		) => {
			const elementAnalysis = new ElementAnalysis(
				interactionThatTriggeredRedirect.getElement(),
				interactionThatTriggeredRedirect.getPageUrl(),
				ElementAnalysisStatus.Done
			);
			await this.elementAnalysisStorage.set(elementAnalysis.getId(), elementAnalysis);

			// @ts-ignore
			this.addVariantToScenario(newVariant, scenario, feature);

			const uiElements: Array<UIElement> = await this.getUniqueUIElements(
				scenario.getVariants()
			);
			feature?.setUiElements(uiElements);

			if (redirectionCallback) {
				// Typescrypt bugou em uma verificação abaixo
				// @ts-ignore
				await redirectionCallback(interactionThatTriggeredRedirect, newVariant, feature);
			}
		};

		let pathsOfElementsToIgnore: string[] = [];
		let variant: Variant | null = null;
		if (previousInteractions.length > 0) {
			pathsOfElementsToIgnore = previousInteractions.map((interaction) => {
				return getPathTo(interaction.getElement());
			});
			const lastInteraction = previousInteractions[previousInteractions.length - 1];
			variant = lastInteraction.getVariant();
		}

		let variantAnalyzed: Variant | null;

		do {
			variantAnalyzed = await this.variantGenerator.generate(
				analysisElement,
				url,
				observer,
				feature,
				callback,
				variant,
				pathsOfElementsToIgnore
			);

			if (variantAnalyzed) this.addVariantToScenario(variantAnalyzed, scenario, feature);
		} while (feature.needNewVariants && feature.getVariantsCount() <= limitsOfVariants);

		observer.disconnect();

		if (feature.getVariantsCount() == 0) {
			return null;
		}

		const uniqueUiElements: Array<UIElement> = await this.getUniqueUIElements(
			scenario.getVariants()
		);
		feature.setUiElements(uniqueUiElements);

		return feature;
	}

	private addVariantToScenario(
		variantAnalyzed: Variant,
		scenario: Scenario,
		feature: Feature
	): void {
		if (variantAnalyzed && variantAnalyzed.isValid()) {
			scenario.addVariant(variantAnalyzed);

			// if true, starts analyzing the buttons after the final action button if the variant just found it
			if (!feature.analysesBtnsAfterFinalActionBtn) {
				feature.analysesBtnsAfterFinalActionBtn = this.checksIfContainsOnlyneFinalActionButton(
					variantAnalyzed
				);
			}

			if (feature.analysesBtnsAfterFinalActionBtn) {
				// if true, starts analyzing only the cancel buttons
				feature.analysesOnlyCancelBtns = this.checksIfAnalysesOnlyCancelBtns(
					feature.btnsAfterFinalActionBtn,
					feature.interactedElements
				);
			}
		} else {
			feature.setMaxVariantCount(feature.getMaxVariantsCount() - 1);
		}

		this.checskNeedNewVariant(feature);
	}

	private checskNeedNewVariant(feature: Feature): void {
		feature.needNewVariants =
			feature.getVariantsCount() < feature.getMaxVariantsCount() ? true : false;
	}

	private async getUniqueUIElements(variants: Variant[]): Promise<Array<UIElement>> {
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

	private discoverElementMaxVariantCount(
		analysisElement: HTMLElement,
		ignoreFormElements: boolean
	): number {
		let variantsMaxCount: number = 1;

		let element = analysisElement.cloneNode(true) as HTMLElement;

		if (ignoreFormElements) {
			let forms = element.getElementsByTagName('form');

			if (forms.length > 0) {
				for (let form of forms) {
					form.remove();
				}
			}
		}

		const inputs = Array.from(element.getElementsByTagName('input'));

		// analyze checkbox
		const checkBoxes = inputs.filter((input) => input.type === 'checkbox');
		if (checkBoxes.length > 0) {
			variantsMaxCount = 2;
		}

		// analyze radio buttons
		const radios = inputs.filter((input) => input.type === 'radio');
		if (radios.length > 0) {
			const variantCountByRadios = this.discoverVariantCountByRadios(radios);

			variantsMaxCount =
				variantCountByRadios > variantsMaxCount ? variantCountByRadios : variantsMaxCount;
		}

		// analyze buttons
		const buttons = Array.from(element.getElementsByTagName('button'));
		if (buttons.length > 0) {
			const variantCountByButtons = this.discoverVariantCountByButtons(buttons);

			variantsMaxCount =
				variantCountByButtons > variantsMaxCount ? variantCountByButtons : variantsMaxCount;
		}

		return variantsMaxCount;
	}

	private discoverVariantCountByRadios(radios: HTMLInputElement[]): number {
		let radiosGroupCounter: Array<{ name: string; count: number }> = [];

		for (let radio of radios) {
			const indexGroup = radiosGroupCounter.findIndex(
				(radioGroup) => radioGroup.name === radio.name
			);

			if (indexGroup !== -1) {
				radiosGroupCounter[indexGroup].count++;
			} else {
				radiosGroupCounter.push({ name: radio.name, count: 1 });
			}
		}

		// get the group with the highest number of radios
		const maxCountGroup = radiosGroupCounter.reduce((maxValue, radioGroup) => {
			return radioGroup.count > maxValue ? radioGroup.count : maxValue;
		}, 0);

		return maxCountGroup ? maxCountGroup : 1;
	}

	private discoverVariantCountByButtons(buttons: HTMLButtonElement[]): number {
		let variantCountByButton = 0;

		for (let button of buttons) {
			if (
				!button.disabled &&
				!button.hidden &&
				button.style.display !== 'none' &&
				button.style.visibility !== 'hidden'
			) {
				variantCountByButton++;
			}
		}

		return variantCountByButton;
	}

	/**
	 * checks that the variant only contains a button element and it is the final action button
	 */
	private checksIfContainsOnlyneFinalActionButton(variant: Variant): boolean {
		if (!variant.finalActionButtonFound) {
			return false;
		}

		const analyzedBtnsCount = variant.getNumberOfAnalyzedButtons();

		if (analyzedBtnsCount >= 2 || analyzedBtnsCount <= 0) {
			return false;
		}

		return true;
	}

	/**
	 * checks whether only cancel buttons should be analyzed
	 * this happens when there are only cancel buttons to be analyzed
	 */
	public checksIfAnalysesOnlyCancelBtns(btnsAfterFinalActionBtn, interactedElements): boolean {
		if (btnsAfterFinalActionBtn.length <= 0) {
			return false;
		}

		// checks if there is any button after the final action button that is not a cancel button and has not been analyzed
		const anyOtherBtn = btnsAfterFinalActionBtn.some((btn) => {
			if (btn.isCancelButton) {
				return false;
			}

			const analysed = interactedElements.some(
				(interactedElm) => interactedElm.xpath === btn.xpath
			);

			if (!analysed) {
				return true;
			}
		});

		if (anyOtherBtn) {
			return false;
		}

		return true;
	}
}

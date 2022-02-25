import { BrowserContext } from '../crawler/BrowserContext';
import { ElementAnalysis } from '../crawler/ElementAnalysis';
import { ElementAnalysisStatus } from '../crawler/ElementAnalysisStatus';
import { ElementInteraction } from '../crawler/ElementInteraction';
import { ElementInteractionGraph } from '../crawler/ElementInteractionGraph';
import { ForcingExecutionStoppageError } from '../crawler/ForcingExecutionStoppageError';
import { MutationObserverManager } from '../mutation-observer/MutationObserverManager';
import { ElementAnalysisStorage } from '../storage/ElementAnalysisStorage';
import { ObjectStorage } from '../storage/ObjectStorage';
import { getPathTo, sleep } from '../util';
import { Feature } from './Feature';
import { FeatureUtil } from './FeatureUtil';
import { Scenario } from './Scenario';
import { Spec } from './Spec';
import { UIElement } from './UIElement';
import { Variant } from './Variant';
import { VariantGenerator } from './VariantGenerator';
import { limitOfVariants } from '../config';
import { VariantGeneratorUtil } from './VariantGeneratorUtil';
import { CommunicationChannel } from '../../shared/comm/CommunicationChannel';
import { Message } from '../../shared/comm/Message';
import { Command } from '../../shared/comm/Command';
import { classToPlain } from 'class-transformer';
import { ForcingExecutionStoppageErrorFromInteraction } from '../crawler/ForcingExecutionStoppageErrorFromInteraction';

export class FeatureGenerator {
	constructor(
		private variantGenerator: VariantGenerator,
		private featureUtil: FeatureUtil,
		private elementAnalysisStorage: ElementAnalysisStorage,
		private browserContext: BrowserContext,
		private elementInteractionGraph: ElementInteractionGraph,
		private variantStorage: ObjectStorage<Variant>
	) {}

	public async generate(
		spec: Spec,
		analysisElement: HTMLElement,
		url: URL,
		ignoreFormElements: boolean = false,
		redirectionCallback?: (feature: Feature, unloadMessageExtra: any) => Promise<void>,
		feature: Feature | null = null,
		previousInteractions: Array<ElementInteraction<HTMLElement>> = []
	): Promise<Feature | null> {
		if (!feature) {
			feature = this.initializeNewFeature(spec, analysisElement, ignoreFormElements);
		}

		console.log('feature a ser analisada FEATUREGENERATOR', feature);

		const scenario = feature.getGeneralScenario();

		let observer: MutationObserverManager = new MutationObserverManager(
			analysisElement.ownerDocument.body
		);

		const callback = await this.generatesCallBack(
			scenario,
			feature,
			analysisElement,
			redirectionCallback
		);

		let pathsOfElementsToIgnore: string[] = [];
		let variant: Variant | null = null;

		if (previousInteractions.length > 0) {
			const lastInteraction = previousInteractions[previousInteractions.length - 1];

			const isNextInteractionOnAnotherPage = await this.elementInteractionGraph.isNextInteractionOnAnotherPage(
				lastInteraction
			);

			//Only enters this block in the case of a redirection
			if (isNextInteractionOnAnotherPage) {
				const interactionVariant = lastInteraction.getVariant();
				if (typeof interactionVariant === 'string') {
					variant = await this.variantStorage.get(interactionVariant);
				}
				pathsOfElementsToIgnore = previousInteractions.map((interaction) => {
					return getPathTo(interaction.getElement());
				});
			}
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

			console.log('variantAnalyzed return FEATUREGENERATOR', variantAnalyzed);

			if (variantAnalyzed) {

				console.log('variant analisada com sucesso FEATUREGENERATOR');

				this.addVariantToScenario(variantAnalyzed, scenario, feature);
				this.variantStorage.set(variantAnalyzed.getId(), variantAnalyzed);
				await spec.addFeature(feature);
				if (feature.needNewVariants && variantAnalyzed.isValid()) {
					
					// if(
					// 	variantAnalyzed.getSentences().some(sentence => sentence.uiElement?.getId() == "/html/body/table/tbody/tr/td[1]/div/div[1]/div[2]/a") &&
					// 	window.location.href.includes("product/index.php")
					// ){
					// 	console.log('variantAnalyzed novo produto', variantAnalyzed);
					// }

					// if(variantAnalyzed.causedRedirect){
					// 	throw new ForcingExecutionStoppageErrorFromInteraction('SAINDO DO RELOAD');
					// }

					console.log('reload da página no fim da variant FEATUREGENERATOR');

					this.browserContext.getWindow().location.reload();
					throw new ForcingExecutionStoppageError('Forcing execution to stop');
				} else {
					console.log('analysisElement como done FEATUREGENERATOR', analysisElement);
					this.setElementAnalysisAsDone(analysisElement);
				}
			}
		} while (feature.needNewVariants && feature.getVariantsCount() < limitOfVariants);

		observer.disconnect();

		if (feature.getVariantsCount() == 0) {
			this.setElementAnalysisAsDone(analysisElement);
			// return null;
		}

		const uniqueUiElements: UIElement[] = this.getUniqueUIElements(
			scenario.getVariants()
		);
		
		if(uniqueUiElements.length > 0){
			feature.setUiElements(uniqueUiElements);
		}

		console.log('feature finalizada FEATUREGENERATOR', feature);

		return feature;
	}

	private setElementAnalysisAsDone(element: HTMLElement): void {
		const elementAnalysis = new ElementAnalysis(
			element,
			this.browserContext.getUrl(),
			ElementAnalysisStatus.Done,
			this.browserContext.getTabId()
		);
		this.elementAnalysisStorage.set(elementAnalysis.getId(), elementAnalysis);
	}

	private initializeNewFeature(
		spec: Spec,
		analysisElement: HTMLElement,
		ignoreFormElements: boolean
	): Feature {
		const feature = this.featureUtil.createFeatureFromElement(
			analysisElement,
			spec.featureCount()
		);

		feature.ignoreFormElements = ignoreFormElements;

		const maxVariantCount: number = this.discoverElementMaxVariantCount(
			analysisElement,
			feature.ignoreFormElements
		);
		feature.setMaxVariantCount(maxVariantCount);

		return feature;
	}

	private async generatesCallBack(
		scenario: Scenario,
		feature: Feature,
		analysisElement: HTMLElement,
		redirectionCallback?: (feature: Feature, unloadMessageExtra: any) => Promise<void>
	) {
		return async (
			interactionThatTriggeredRedirect: ElementInteraction<HTMLElement>,
			newVariant: Variant,
			unloadMessageExtra: any
		) => {
			this.addVariantToScenario(newVariant, scenario, feature);

			//await this.variantStorage.set(newVariant.getId(), newVariant);

			//unloadMessageExtra.newVariant = newVariant;

			const uiElements: Array<UIElement> = this.getUniqueUIElements(
				scenario.getVariants()
			);
			feature.setUiElements(uiElements);

			unloadMessageExtra.feature = classToPlain(feature);

			unloadMessageExtra.analysisElementPath = getPathTo(analysisElement);

			console.log('redirecionamento CALLBACK 2 FEATUREGENERATOR feature:', feature);

			if (redirectionCallback) {
				await redirectionCallback(feature, unloadMessageExtra);
			}
		};
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

		const needsNewVariants = this.needsNewVariants(feature);
		feature.needNewVariants = needsNewVariants;
	}

	private needsNewVariants(feature: Feature): boolean {
		return feature.getVariantsCount() < feature.getMaxVariantsCount() ? true : false;
	}

	private getUniqueUIElements(variants: Variant[]):Array<UIElement> {
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

		// analyze buttons and anchors
		const elms = Array.from(element.querySelectorAll('button, input, a'));
		const buttons = this.buttonsFilter(elms);

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

	private buttonsFilter(elms) {
		return elms.filter((elm) => {
			let htmlElm = elm as HTMLElement;

			if (
				(elm instanceof HTMLInputElement &&
					(elm.type == 'button' || elm.type == 'submit' || elm.type == 'reset')) ||
				elm instanceof HTMLButtonElement ||
				elm instanceof HTMLAnchorElement
			) {
				return htmlElm;
			}
		});
	}

	private discoverVariantCountByButtons(buttons): number {
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

		let variantBtnElements = variant.getButtonsElements();

		if (variantBtnElements.length != 1) {
			return false;
		}

		const variantGeneratorUtil = new VariantGeneratorUtil();

		const isFinalActionBtn = variantGeneratorUtil.isFinalActionButton(variantBtnElements[0]);

		return isFinalActionBtn;
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

import { BrowserContext } from '../crawler/BrowserContext';
import { ElementAnalysis } from '../crawler/ElementAnalysis';
import { ElementAnalysisStatus } from '../crawler/ElementAnalysisStatus';
import { ElementInteraction } from '../crawler/ElementInteraction';
import { ElementInteractionGraph } from '../crawler/ElementInteractionGraph';
import { ForcingExecutionStoppageError } from '../crawler/ForcingExecutionStoppageError';
import { MutationSenteceHandler } from './MutationObserverManager';
import { ElementAnalysisStorage } from '../storage/ElementAnalysisStorage';
import { ObjectStorage } from '../storage/ObjectStorage';
import { getPathTo } from '../util';
import { Feature } from './Feature';
import { FeatureUtil } from './FeatureUtil';
import { Scenario } from './Scenario';
import { Spec } from './Spec';
import { Variant } from './Variant';
import { VariantGenerator } from './VariantGenerator';
import { VariantGeneratorUtil } from './VariantGeneratorUtil';
import { classToPlain } from 'class-transformer';
import { Config } from '../../shared/config';

export class FeatureGenerator {
	constructor(
		private variantGenerator: VariantGenerator,
		private featureUtil: FeatureUtil,
		private elementAnalysisStorage: ElementAnalysisStorage,
		private browserContext: BrowserContext,
		private elementInteractionGraph: ElementInteractionGraph,
		private variantStorage: ObjectStorage<Variant>,
		private config: Config,
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
			feature = this.initializeNewFeature(spec, analysisElement, ignoreFormElements, url);
		}

		const scenario = feature.getGeneralScenario();

		let mutationSentenceHandler: MutationSenteceHandler = new MutationSenteceHandler(
			analysisElement.ownerDocument.body,
			feature,
			this.featureUtil
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
				mutationSentenceHandler,
				feature,
				callback,
				variant,
				pathsOfElementsToIgnore
			);

			if (variantAnalyzed) {
				this.addVariantToScenario(variantAnalyzed, scenario, feature);
				this.variantStorage.set(variantAnalyzed.getId(), variantAnalyzed);
				await spec.addFeature(feature);
				if (feature.needNewVariants && variantAnalyzed.isValid()) {
					this.browserContext.getWindow().location.reload();
					throw new ForcingExecutionStoppageError('Forcing execution to stop');
				} else {
					this.setElementAnalysisAsDone(analysisElement);
				}
			}
		} while (feature.needNewVariants && feature.getVariantsCount() < this.config.limitOfVariants);

		mutationSentenceHandler.disconnect();

		if (feature.getVariantsCount() == 0) {
			this.setElementAnalysisAsDone(analysisElement);
		}

		return feature;
	}

	private setElementAnalysisAsDone(element: HTMLElement): void {
		const elementAnalysis = new ElementAnalysis(
			element,
			this.browserContext.getUrl(),
			ElementAnalysisStatus.Done,
			this.browserContext.getTabId(),
			this.config
		);
		this.elementAnalysisStorage.set(elementAnalysis.getId(), elementAnalysis);
	}

	private initializeNewFeature(
		spec: Spec,
		analysisElement: HTMLElement,
		ignoreFormElements: boolean,
		url: URL
	): Feature {
		const feature = this.featureUtil.createFeatureFromElement(
			analysisElement,
			spec.featureCount(),
			url
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

			unloadMessageExtra.feature = classToPlain(feature);

			unloadMessageExtra.analysisElementPath = getPathTo(analysisElement);

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

			// if true, starts analyzing the clicables after the final action clicable if the variant just found it
			if (!feature.analysesClicablesAfterFinalActionClicable) {
				feature.analysesClicablesAfterFinalActionClicable = this.checksIfContainsOnlyneFinalActionClicable(
					variantAnalyzed
				);
			}

			if (feature.analysesClicablesAfterFinalActionClicable) {
				// if true, starts analyzing only the cancel clicables
				feature.analysesOnlyCancelClicables = this.checksIfAnalysesOnlyCancelClicables(
					feature.clicablesAfterFinalActionClicable,
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

		// analyze clicables and anchors
		const elms = Array.from(element.querySelectorAll('button, input, a'));
		const clicables = this.clicablesFilter(elms);

		if (clicables.length > 0) {
			const variantCountByClicables = this.discoverVariantCountByClicables(clicables);

			variantsMaxCount =
				variantCountByClicables > variantsMaxCount ? variantCountByClicables : variantsMaxCount;
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

	private clicablesFilter(elms) {
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

	private discoverVariantCountByClicables(clicables): number {
		let variantCountByClicable = 0;

		for (let clicable of clicables) {
			if (
				!clicable.disabled &&
				!clicable.hidden &&
				clicable.style.display !== 'none' &&
				clicable.style.visibility !== 'hidden'
			) {
				variantCountByClicable++;
			}
		}

		return variantCountByClicable;
	}

	/**
	 * checks that the variant only contains a clicable element and it is the final action clicable
	 */
	private checksIfContainsOnlyneFinalActionClicable(variant: Variant): boolean {
		if (!variant.finalActionClicableFound) {
			return false;
		}

		let variantClicableElements = variant.getClicablesElements();

		if (variantClicableElements.length != 1) {
			return false;
		}

		const variantGeneratorUtil = new VariantGeneratorUtil();

		const isFinalActionClicable = variantGeneratorUtil.isFinalActionClicable(variantClicableElements[0]);

		return isFinalActionClicable;
	}

	/**
	 * checks whether only cancel clicables should be analyzed
	 * this happens when there are only cancel clicables to be analyzed
	 */
	public checksIfAnalysesOnlyCancelClicables(clicablesAfterFinalActionClicable, interactedElements): boolean {
		if (clicablesAfterFinalActionClicable.length <= 0) {
			return false;
		}

		// checks if there is any clicable after the final action clicables that is not a cancel clicable and has not been analyzed
		const anyOtherClicable = clicablesAfterFinalActionClicable.some((clb) => {
			if (clb.isCancelClicable) {
				return false;
			}

			const analysed = interactedElements.some(
				(interactedElm) => interactedElm.xpath === clb.xpath
			);

			if (!analysed) {
				return true;
			}
		});

		if (anyOtherClicable) {
			return false;
		}

		return true;
	}
}

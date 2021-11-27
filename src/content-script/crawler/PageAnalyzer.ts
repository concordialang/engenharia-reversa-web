import { HTMLElementType } from '../enums/HTMLElementType';
import { FeatureGenerator } from '../spec-analyser/FeatureGenerator';
import { Spec } from '../spec-analyser/Spec';
import { ElementAnalysisStorage } from '../storage/ElementAnalysisStorage';
import { getFormElements, getPathTo } from '../util';
import { ElementAnalysis } from './ElementAnalysis';
import { ElementAnalysisStatus } from './ElementAnalysisStatus';
import { BrowserContext } from './BrowserContext';
import { ElementInteraction } from './ElementInteraction';
import { Feature } from '../spec-analyser/Feature';
import { Variant } from '../spec-analyser/Variant';
import { ObjectStorage } from '../storage/ObjectStorage';
import { ElementInteractionExecutor } from './ElementInteractionExecutor';
import { ElementInteractionGraph } from './ElementInteractionGraph';

export class PageAnalyzer {
	private redirectCallback: (
		interactionThatTriggeredRedirect: ElementInteraction<HTMLElement>,
		variant: Variant,
		feature: Feature
	) => Promise<void>;

	constructor(
		private featureGenerator: FeatureGenerator,
		private elementAnalysisStorage: ElementAnalysisStorage,
		private spec: Spec,
		private browserContext: BrowserContext,
		private featureStorage: ObjectStorage<Feature>,
		private elementInteractionExecutor: ElementInteractionExecutor,
		private elementInteractionGraph: ElementInteractionGraph
	) {
		this.redirectCallback = async (
			interactionThatTriggeredRedirect: ElementInteraction<HTMLElement>,
			variant: Variant,
			feature: Feature
		) => {
			const analysisFinished = await this.isAnalysisFinished(
				feature,
				variant,
				interactionThatTriggeredRedirect
			);

			if (analysisFinished) {
				this.setFeatureUiElementsAsAnalyzed(feature);
			}
			this.spec.addFeature(feature);
		};
	}

	private setFeatureUiElementsAsAnalyzed(feature: Feature) {
		const uiElements = feature.getUiElements();
		for (let uiElement of uiElements) {
			const element = <HTMLElement>uiElement.getSourceElement();
			if (element) {
				const analysis = new ElementAnalysis(
					element,
					this.browserContext.getUrl(),
					ElementAnalysisStatus.Done
				);
				this.elementAnalysisStorage.set(analysis.getId(), analysis);
			} else {
				// FIXME Descomentar essa parte
				//throw new Error("UIElement source element doesn't exist");
			}
		}
	}

	public async analyze(
		url: URL,
		contextElement: HTMLElement,
		previousInteractions: ElementInteraction<HTMLElement>[] = []
	): Promise<void> {
		let xPath = getPathTo(contextElement);
		if (xPath) {
			let feature: Feature | string | null = null;
			const lastInteraction = previousInteractions[previousInteractions.length - 1];
			if (lastInteraction) {
				feature = lastInteraction.getFeature();
				if (typeof feature === 'string') {
					feature = await this.featureStorage.get(feature);
				}
			}
			const elementAnalysisStatus = await this.elementAnalysisStorage.getElementAnalysisStatus(
				xPath,
				url
			);

			if (
				elementAnalysisStatus == ElementAnalysisStatus.Pending ||
				feature?.needNewVariants
			) {
				if (lastInteraction) {
					//Only re-executes previous interactions when is revisting the page after a redirect
					if (
						await this.elementInteractionGraph.isNextInteractionOnAnotherPage(
							lastInteraction
						)
					) {
						for (let interaction of previousInteractions) {
							if (
								!(await this.elementInteractionGraph.isNextInteractionOnAnotherPage(
									interaction
								))
							) {
								await this.elementInteractionExecutor.execute(
									interaction,
									undefined,
									false
								);
							}
						}
					}
				}

				/*TODO Essa parte do código que altera o status de análise para in progress pode gerar uma condição de corrida, 
				analisar novamente depois
				*/
				const elementAnalysis = new ElementAnalysis(
					contextElement,
					this.browserContext.getUrl(),
					ElementAnalysisStatus.InProgress
				);
				this.elementAnalysisStorage.set(elementAnalysis.getId(), elementAnalysis);

				await this.analyseFormElements(url, contextElement, feature, previousInteractions);

				if (contextElement.nodeName !== HTMLElementType.FORM) {
					// generate feature for elements outside forms
					const featureOuterFormElements = await this.featureGenerator.generate(
						contextElement,
						url,
						true,
						this.redirectCallback,
						feature,
						previousInteractions
					);

					if (featureOuterFormElements) {
						const analysisFinished = await this.isAnalysisFinished(
							featureOuterFormElements
						);

						if (analysisFinished) {
							this.setFeatureUiElementsAsAnalyzed(featureOuterFormElements);
						}
						this.spec.addFeature(featureOuterFormElements);
					}
				}
			}
		}
	}

	private async analyseFormElements(
		url: URL,
		analysisElement: HTMLElement,
		feature: Feature | null = null,
		previousInteractions: ElementInteraction<HTMLElement>[] = []
	) {
		const formElements: NodeListOf<Element> | HTMLElement[] =
			analysisElement.nodeName === HTMLElementType.FORM
				? [analysisElement]
				: getFormElements(analysisElement);

		if (formElements.length > 0) {
			for (let formElement of formElements) {
				let xPathElement = getPathTo(formElement as HTMLElement);

				if (!xPathElement) {
					continue;
				}

				const isElementAnalyzed =
					(await this.elementAnalysisStorage.getElementAnalysisStatus(
						xPathElement,
						url
					)) == ElementAnalysisStatus.Done;

				if (!isElementAnalyzed) {
					feature = await this.featureGenerator.generate(
						formElement as HTMLElement,
						url,
						false,
						this.redirectCallback,
						feature,
						previousInteractions
					);

					if (feature) {
						const analysisFinished = await this.isAnalysisFinished(feature);

						if (analysisFinished) {
							this.setFeatureUiElementsAsAnalyzed(feature);
						}
						this.spec.addFeature(feature);
					}
				}
			}
		}
	}

	private async isAnalysisFinished(
		feature: Feature,
		variant: Variant | null = null,
		currentInteraction: ElementInteraction<HTMLElement> | null = null
	): Promise<boolean> {
		if (currentInteraction) {
			const element = currentInteraction.getElement();
			if (element.getAttribute('type') !== 'submit') {
				return false;
			}
			return true;
		}
		return false;
	}
}

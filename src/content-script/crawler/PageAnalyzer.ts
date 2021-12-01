import { HTMLElementType } from '../enums/HTMLElementType';
import { FeatureManager } from '../spec-analyser/FeatureManager';
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

	private spec: Spec | null = null;

	constructor(
		private featureManager: FeatureManager,
		private elementAnalysisStorage: ElementAnalysisStorage,
		private browserContext: BrowserContext,
		private featureStorage: ObjectStorage<Feature>,
		private elementInteractionExecutor: ElementInteractionExecutor,
		private elementInteractionGraph: ElementInteractionGraph,
		private specStorage: ObjectStorage<Spec>
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
			if (this.spec) {
				this.spec.addFeature(feature);
				await this.specStorage.set('Spec', this.spec);
			}
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
		spec: Spec,
		url: URL,
		contextElement: HTMLElement,
		previousInteractions: ElementInteraction<HTMLElement>[] = []
	): Promise<void> {
		this.spec = spec;
		let xPath = getPathTo(contextElement);
		if (xPath) {
			let feature: Feature | string | null = null;
			const lastInteraction = previousInteractions[previousInteractions.length - 1];
			if (
				lastInteraction &&
				lastInteraction.getPageUrl().href === this.browserContext.getUrl().href
			) {
				let interactionFeature: Feature | string | null = lastInteraction.getFeature();
				if (typeof interactionFeature === 'string') {
					interactionFeature = await this.featureStorage.get(interactionFeature);
				}
				if (interactionFeature?.needNewVariants) {
					feature = interactionFeature;
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
					const featureOuterFormElements = await this.featureManager.generateFeature(
						this.spec,
						contextElement,
						url,
						true,
						this.redirectCallback,
						null,
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

				if (!isElementAnalyzed && this.spec) {
					feature = await this.featureManager.generateFeature(
						this.spec,
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
						if (this.spec) {
							this.spec.addFeature(feature);
						}
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
		if (!feature.needNewVariants) {
			return true;
		}
		return false;
	}
}

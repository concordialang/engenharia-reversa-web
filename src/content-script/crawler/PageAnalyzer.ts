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
import { ObjectStorage } from '../storage/ObjectStorage';
import { ElementInteractionExecutor } from './ElementInteractionExecutor';
import { ElementInteractionGraph } from './ElementInteractionGraph';

export class PageAnalyzer {
	private redirectCallback: (feature: Feature) => Promise<void>;

	private spec: Spec | null = null;

	constructor(
		private featureGenerator: FeatureGenerator,
		private elementAnalysisStorage: ElementAnalysisStorage,
		private browserContext: BrowserContext,
		private featureStorage: ObjectStorage<Feature>,
		private elementInteractionExecutor: ElementInteractionExecutor,
		private elementInteractionGraph: ElementInteractionGraph
	) {
		this.redirectCallback = async (feature: Feature) => {
			await this.saveFeatureToSpec(feature);
		};
	}

	public async analyze(
		spec: Spec,
		url: URL,
		contextElement: HTMLElement,
		previousInteractions: ElementInteraction<HTMLElement>[] = [],
		stopBeforeAnalysisStarts: boolean = false
	): Promise<void> {
		this.spec = spec;
		let xPath = getPathTo(contextElement);

		if (!xPath) {
			return;
		}

		let feature: Feature | string | null = null;

		const lastInteraction = previousInteractions[previousInteractions.length - 1];

		if (
			lastInteraction &&
			lastInteraction.getPageUrl().href === this.browserContext.getUrl().href
		) {
			feature = await this.recoveryFeatureOfLastInteraction(lastInteraction);
		}

		const elementAnalysis = await this.elementAnalysisStorage.getWithXpathAndUrl(xPath, url);

		let elementAnalysisStatus: ElementAnalysisStatus;
		let analysisTab: string | null = null;
		if (elementAnalysis) {
			elementAnalysisStatus = elementAnalysis.getStatus();
			analysisTab = elementAnalysis.getTabId();
		} else {
			elementAnalysisStatus = ElementAnalysisStatus.Pending;
			analysisTab = null;
		}

		if (
			elementAnalysisStatus == ElementAnalysisStatus.Pending ||
			(elementAnalysisStatus == ElementAnalysisStatus.InProgress &&
				analysisTab == this.browserContext.getTabId())
		) {
			//Only re-executes previous interactions when is revisting the page after a redirect
			if (lastInteraction) {
				await this.executePreviousInteraction(previousInteractions, lastInteraction);
			}

			const elementAnalysis = new ElementAnalysis(
				contextElement,
				this.browserContext.getUrl(),
				ElementAnalysisStatus.InProgress,
				this.browserContext.getTabId()
			);
			this.elementAnalysisStorage.set(elementAnalysis.getId(), elementAnalysis);

			if (stopBeforeAnalysisStarts) {
				return;
			}

			await this.analyseFormElements(url, contextElement, feature, previousInteractions);

			if (contextElement.nodeName !== HTMLElementType.FORM) {
				// generate feature for elements outside forms
				const featureOuterFormElements = await this.featureGenerator.generate(
					spec,
					contextElement,
					url,
					true,
					this.redirectCallback,
					null,
					previousInteractions
				);

				if (featureOuterFormElements) {
					await this.saveFeatureToSpec(featureOuterFormElements);
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
					feature = await this.featureGenerator.generate(
						this.spec,
						formElement as HTMLElement,
						url,
						false,
						this.redirectCallback,
						feature,
						previousInteractions
					);

					if (feature) {
						await this.saveFeatureToSpec(feature);
					}
				}
			}
		}
	}

	private async isAnalysisFinished(feature: Feature): Promise<boolean> {
		if (!feature.needNewVariants) {
			return true;
		}
		return false;
	}

	private async recoveryFeatureOfLastInteraction(lastInteraction): Promise<Feature | null> {
		let interactionFeature: Feature | string | null = lastInteraction.getFeature();
		if (typeof interactionFeature === 'string') {
			interactionFeature = await this.featureStorage.get(interactionFeature);
		}

		return interactionFeature;
	}

	private async executePreviousInteraction(previousInteractions, lastInteraction) {
		const isNextInteractionOnAnotherPage = await this.elementInteractionGraph.isNextInteractionOnAnotherPage(
			lastInteraction
		);

		if (!isNextInteractionOnAnotherPage) {
			return;
		}

		for (let interaction of previousInteractions) {
			const isNext = await this.elementInteractionGraph.isNextInteractionOnAnotherPage(
				interaction
			);

			if (!isNext) {
				await this.elementInteractionExecutor.execute(interaction, undefined, false);
			}
		}
	}

	private async saveFeatureToSpec(feature: Feature) {
		const analysisFinished = await this.isAnalysisFinished(feature);

		if (analysisFinished) {
			this.setFeatureUiElementsAsAnalyzed(feature);
		}
		if (this.spec) {
			this.spec.addFeature(feature);
		}
	}

	private setFeatureUiElementsAsAnalyzed(feature: Feature) {
		const uiElements = feature.getUiElements();
		for (let uiElement of uiElements) {
			const element = uiElement.getSourceElement() as HTMLElement;
			if (element) {
				const analysis = new ElementAnalysis(
					element,
					this.browserContext.getUrl(),
					ElementAnalysisStatus.Done,
					this.browserContext.getTabId()
				);
				this.elementAnalysisStorage.set(analysis.getId(), analysis);
			}
			// else {
			// 	throw new Error("UIElement source element doesn't exist");
			// }
		}
	}
}

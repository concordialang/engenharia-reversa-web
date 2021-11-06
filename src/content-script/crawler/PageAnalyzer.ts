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

export class PageAnalyzer {
	private redirectCallback: (feature: Feature) => Promise<void>;

	constructor(
		private featureManager: FeatureManager,
		private elementAnalysisStorage: ElementAnalysisStorage,
		private spec: Spec,
		private browserContext: BrowserContext
	) {
		const _this = this;
		this.redirectCallback = async (feature: Feature) => {
			_this.spec.addFeature(feature);
		};
	}

	public async analyze(url: URL, contextElement: HTMLElement): Promise<void> {
		let xPath = getPathTo(contextElement);
		if (xPath) {
			const elementAnalysisStatus = await this.elementAnalysisStorage.getElementAnalysisStatus(
				xPath,
				url
			);
			if (elementAnalysisStatus == ElementAnalysisStatus.Pending) {
				/*TODO Essa parte do código que altera o status de análise para in progress pode gerar uma condição de corrida, 
				analisar novamente depois
				*/
				const elementAnalysis = new ElementAnalysis(
					contextElement,
					this.browserContext.getUrl(),
					ElementAnalysisStatus.InProgress
				);
				this.elementAnalysisStorage.set(elementAnalysis.getId(), elementAnalysis);
				await this.analyseFormElements(url, contextElement);

				if (contextElement.nodeName !== HTMLElementType.FORM) {
					// generate feature for elements outside forms
					const featureOuterFormElements = await this.featureManager.generateFeature(
						contextElement,
						url,
						true,
						this.redirectCallback
					);

					if (featureOuterFormElements) {
						this.spec.addFeature(featureOuterFormElements);
					}
				}
			}
		}
	}

	private async analyseFormElements(url: URL, analysisElement: HTMLElement) {
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
					const feature = await this.featureManager.generateFeature(
						formElement as HTMLElement,
						url,
						false,
						this.redirectCallback
					);

					if (feature) {
						this.spec.addFeature(feature);
					}
				}
			}
		}
	}
}

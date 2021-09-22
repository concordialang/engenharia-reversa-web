import { HTMLElementType } from '../types/HTMLElementType';
import { FeatureManager } from '../spec-analyser/FeatureManager';
import { Spec } from '../spec-analyser/Spec';
import { ElementAnalysisStorage } from '../storage/ElementAnalysisStorage';
import { getFormElements, getPathTo } from '../util';

export class PageAnalyzer {
	constructor(
		private featureManager: FeatureManager,
		private elementAnalysisStorage: ElementAnalysisStorage,
		private spec: Spec
	) {}

	public async analyze(url: URL, contextElement: HTMLElement): Promise<void> {
		let xPath = getPathTo(contextElement);
		if (xPath) {
			const isElementAnalyzed = await this.elementAnalysisStorage.isElementAnalyzed(
				xPath,
				url
			);

			if (!isElementAnalyzed) {
				await this.analyseFormElements(url, contextElement);

				if (contextElement.nodeName !== HTMLElementType.FORM) {
					// generate feature for elements outside forms
					const featureOuterFormElements = await this.featureManager.generateFeature(
						contextElement,
						url,
						true
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

				const isElementAnalyzed = await this.elementAnalysisStorage.isElementAnalyzed(
					xPathElement,
					url
				);

				if (!isElementAnalyzed) {
					const feature = await this.featureManager.generateFeature(
						formElement as HTMLElement,
						url
					);

					if (feature) {
						this.spec.addFeature(feature);
					}
				}
			}
		}
	}
}

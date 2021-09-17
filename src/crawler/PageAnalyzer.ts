import { HTMLElementType } from '../types/HTMLElementType';
import { Feature } from '../spec-analyser/Feature';
import { FeatureManager } from '../spec-analyser/FeatureManager';
import { Spec } from '../spec-analyser/Spec';
import { ElementAnalysisStorage } from '../storage/ElementAnalysisStorage';
import { getFeatureElements, getPathTo } from '../util';
import { ElementAnalysis } from './ElementAnalysis';
import { ElementAnalysisStatus } from './ElementAnalysisStatus';

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
				await this.analyseFeatureElements(url, contextElement);

				if (
					contextElement.nodeName !== HTMLElementType.FORM &&
					contextElement.nodeName !== HTMLElementType.TABLE
				) {
					// generate feature for elements outside feature elements
					const featureOuterElements = await this.featureManager.generateFeature(
						contextElement,
						url,
						true
					);

					if (featureOuterElements) {
						this.spec.addFeature(featureOuterElements);
					}
				}
			}
		}
	}

	private async analyseFeatureElements(
		url: URL,
		analysisElement: HTMLElement
	): Promise<Feature[]> {
		const features: Feature[] = [];

		// case analysisElement is directly a feature element
		if (
			analysisElement.nodeName === HTMLElementType.FORM ||
			analysisElement.nodeName === HTMLElementType.TABLE
		) {
			const feature = await this.featureManager.generateFeature(analysisElement, url);

			if (feature) {
				features.push(feature);
			}
		}

		const featureTags: NodeListOf<Element> = getFeatureElements(analysisElement);
		if (featureTags.length > 0) {
			for (let featureTag of featureTags) {
				let xPathElement = getPathTo(<HTMLElement>featureTag);
				if (!xPathElement) continue;

				const elementAnalysis = await this.elementAnalysisStorage.isElementAnalyzed(
					xPathElement,
					url
				);

				if (!elementAnalysis) {
					const feature = await this.featureManager.generateFeature(
						featureTag as HTMLElement,
						url
					);
					if (feature) {
						this.spec.addFeature(feature);
					}
				}
			}
		}

		return features;
	}
}

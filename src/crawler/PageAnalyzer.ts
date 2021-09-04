import { HTMLNodeTypes } from '../html/HTMLNodeTypes';
import { Feature } from '../spec-analyser/Feature';
import { FeatureManager } from '../spec-analyser/FeatureManager';
import { Spec } from '../spec-analyser/Spec';
import { AnalyzedElementStorage } from '../storage/AnalyzedElementStorage';
import { getFeatureElements, getPathTo } from '../util';

export class PageAnalyzer {
	constructor(
		private featureManager: FeatureManager,
		private analyzedElementStorage: AnalyzedElementStorage,
		private spec: Spec
	) {}

	public async analyze(url: URL, contextElement: HTMLElement): Promise<void> {
		let xPath = getPathTo(contextElement);
		if (xPath) {
			const isElementAnalyzed = await this.analyzedElementStorage.isElementAnalyzed(
				xPath,
				url
			);

			if (!isElementAnalyzed) {
				let features: Feature[] = await this.analyseFeatureElements(url, contextElement);

				if (
					contextElement.nodeName !== HTMLNodeTypes.FORM &&
					contextElement.nodeName !== HTMLNodeTypes.TABLE
				) {
					// generate feature for elements outside feature elements
					const featureOuterElements = await this.featureManager.generateFeature(
						contextElement,
						url,
						true
					);

					if (featureOuterElements) {
						features.push(featureOuterElements);
					}
				}

				if (features.length > 0) {
					this.spec.addFeatures(features);
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
			analysisElement.nodeName === HTMLNodeTypes.FORM ||
			analysisElement.nodeName === HTMLNodeTypes.TABLE
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

				const analyzedElement = await this.analyzedElementStorage.isElementAnalyzed(
					xPathElement,
					url
				);

				if (!analyzedElement) {
					const feature = await this.featureManager.generateFeature(
						featureTag as HTMLElement,
						url
					);
					if (feature) {
						features.push(feature);
					}
				}
			}
		}

		return features;
	}
}

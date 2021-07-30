import { DiffDomManager } from '../diff-dom/DiffDomManager';
import { HTMLNodeTypes } from '../html/HTMLNodeTypes';
import { Spec } from '../spec-analyser/Spec';
import { AnalyzedElementStorage } from '../storage/AnalyzedElementStorage';
import { commonAncestorElement, getFeatureElements } from '../util';
import { FeatureManager } from '../spec-analyser/FeatureManager';
import getXPath from 'get-xpath';
import { Feature } from '../spec-analyser/Feature';

export class PageAnalyzer {
	constructor(
		private featureManager: FeatureManager,
		private analyzedElementStorage: AnalyzedElementStorage,
		private spec: Spec
	) {}

	public async analyze(
		url: URL,
		document: HTMLDocument,
		previousDocument: HTMLDocument | null = null
	): Promise<void> {
		const analysisElement = await this.getAnalysisElement(document, previousDocument);
		if (analysisElement) {
			await this.analyseElement(url, analysisElement);
		}
	}

	public async analyseElement(url: URL, analysisElement: HTMLElement): Promise<void> {
		let xPath = getXPath(analysisElement);
		if (xPath) {
			const isElementAnalyzed = await this.analyzedElementStorage.isElementAnalyzed(
				xPath,
				url
			);

			if (!isElementAnalyzed) {
				let features: Feature[] = await this.analyseFeatureElements(url, analysisElement);

				if (
					analysisElement.nodeName !== HTMLNodeTypes.FORM &&
					analysisElement.nodeName !== HTMLNodeTypes.TABLE
				) {
					// generate feature for elements outside feature elements
					const featureOuterElements = await this.featureManager.generateFeature(
						analysisElement,
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
				let xPathElement = getXPath(featureTag);
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

	private async getAnalysisElement(
		currentDocument: HTMLDocument,
		previousDocument: HTMLDocument | null = null
	): Promise<HTMLElement> {
		let analysisElement: HTMLElement | null = null;

		if (previousDocument) {
			const analysisContext: HTMLElement = await this.getAnalysisContextFromDiffPages(
				currentDocument,
				previousDocument
			);

			analysisElement =
				analysisContext.nodeName === HTMLNodeTypes.FORM ||
				analysisContext.nodeName === HTMLNodeTypes.TABLE
					? analysisContext
					: await this.getAnalysisElementFromCommonAcestor(
							analysisContext,
							currentDocument
					  );
		} else {
			analysisElement = currentDocument.body;
		}

		return analysisElement;
	}

	private async getAnalysisContextFromDiffPages(
		currentDocument: HTMLDocument,
		previousDocument: HTMLDocument
	): Promise<HTMLElement> {
		const diffDomManager: DiffDomManager = new DiffDomManager(
			previousDocument.body,
			currentDocument.body
		);

		const xPathParentElementDiff = diffDomManager.getParentXPathOfTheOutermostElementDiff();

		// returns xpath element
		const xpathResult: XPathResult | null =
			xPathParentElementDiff !== null
				? currentDocument.evaluate(
						xPathParentElementDiff,
						currentDocument,
						null,
						XPathResult.FIRST_ORDERED_NODE_TYPE, // first node that matches the expression
						null
				  )
				: null;

		return xpathResult !== null && xpathResult.singleNodeValue !== null
			? (xpathResult.singleNodeValue as HTMLElement)
			: currentDocument.body;
	}

	private async getAnalysisElementFromCommonAcestor(
		analysisContext: HTMLElement,
		document: HTMLDocument
	): Promise<HTMLElement> {
		let ancestorElement: HTMLElement | null = null;

		const featureTags: NodeListOf<Element> = getFeatureElements(analysisContext);

		if (featureTags.length >= 1) {
			ancestorElement = commonAncestorElement(Array.from(featureTags));
		} else if (featureTags.length == 0) {
			const inputFieldTags = analysisContext.querySelectorAll(
				'input, select, textarea, button'
			);
			ancestorElement = commonAncestorElement(Array.from(inputFieldTags));
		}

		return ancestorElement ? ancestorElement : document.body;
	}
}

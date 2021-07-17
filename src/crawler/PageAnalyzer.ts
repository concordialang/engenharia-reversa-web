import { DiffDomManager } from '../diff-dom/DiffDomManager';
import { HTMLNodeTypes } from '../html/HTMLNodeTypes';
import { Variant } from '../spec-analyser/Variant';
import { AnalyzedElementStorage } from '../storage/AnalyzedElementStorage';
import { commonAncestorElement, getFeatureElements, getPathTo } from '../util';
import { AnalyzedElement } from './AnalyzedElement';
import { ElementInteraction } from './ElementInteraction';
import { VariantGenerator } from './VariantGenerator';

export class PageAnalyzer {
	constructor(
		private variantGenerator: VariantGenerator,
		private analyzedElementStorage: AnalyzedElementStorage
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

	public async analyseElement(url: URL, contextElement: HTMLElement): Promise<Variant | null> {
		let xPath = getPathTo(contextElement);
		if (xPath) {
			const analyzedContext = await this.analyzedElementStorage.isElementAnalyzed(xPath, url);

			if (!analyzedContext) {
				// TODO - VERIFICAR E REMOVER
				const variantsOutsideForm = await this.analyseVariantElements(url, contextElement);

				const _this = this;
				const redirectionCallback = async (
					interaction: ElementInteraction<HTMLElement>
				) => {
					const analyzedElement = new AnalyzedElement(
						interaction.getElement(),
						interaction.getPageUrl()
					);
					await _this.analyzedElementStorage.set(
						analyzedElement.getId(),
						analyzedElement
					);
				};

				if (
					contextElement.nodeName !== HTMLNodeTypes.FORM &&
					contextElement.nodeName !== HTMLNodeTypes.TABLE
				) {
					// generate variant for elements outside feature elements
					return await this.variantGenerator.generate(
						contextElement,
						redirectionCallback,
						true
					);
				}
			}
		} else {
			// TODO - tratar excecao para nao travar o programa
			throw new Error('Unable to get element XPath');
		}
		return null;
	}

	private async analyseVariantElements(
		url: URL,
		contextElement: HTMLElement
	): Promise<Variant[]> {
		const variants: Variant[] = [];

		const _this = this;
		const redirectionCallback = async (interaction: ElementInteraction<HTMLElement>) => {
			const analyzedElement = new AnalyzedElement(
				interaction.getElement(),
				interaction.getPageUrl()
			);
			await _this.analyzedElementStorage.set(analyzedElement.getId(), analyzedElement);
		};

		if (
			contextElement.nodeName === HTMLNodeTypes.FORM ||
			contextElement.nodeName === HTMLNodeTypes.TABLE
		) {
			const variant = await this.variantGenerator.generate(
				contextElement,
				redirectionCallback
			);
			if (variant) {
				variants.push(variant);
			}
		}

		const variantTags: any = getFeatureElements(contextElement);
		if (variantTags.length > 0) {
			for (let variantTag of variantTags) {
				let xPathElement = getPathTo(variantTag);
				if (!xPathElement) continue;

				const analyzedElement = await this.analyzedElementStorage.isElementAnalyzed(
					xPathElement,
					url
				);

				if (!analyzedElement) {
					const feature = await this.variantGenerator.generate(
						variantTag,
						redirectionCallback
					);
					if (feature) {
						variants.push(feature);
					}
				}
			}
		}

		return variants;
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
		const xpathResult: XPathResult | null =
			xPathParentElementDiff !== null
				? currentDocument.evaluate(
						xPathParentElementDiff,
						currentDocument,
						null,
						XPathResult.FIRST_ORDERED_NODE_TYPE,
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

import { DiffDomManager } from '../diff-dom/DiffDomManager';
import { HTMLEventType } from '../html/HTMLEventType';
import { commonAncestorElement, getFeatureElements, getPathTo } from '../util';
import { BrowserContext } from './BrowserContext';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractionGraph } from './ElementInteractionGraph';
import { VariantGenerator } from './VariantGenerator';
import { PageStorage } from '../storage/PageStorage';
import { VisitedURLGraph } from './VisitedURLGraph';
import { HTMLNodeTypes } from '../html/HTMLNodeTypes';
import { AnalyzedElementStorage } from '../storage/AnalyzedElementStorage';
import { AnalyzedElement } from './AnalyzedElement';
import { PageAnalyzer } from './PageAnalyzer';
import { Variant } from '../spec-analyser/Variant';

export class Crawler {
	private lastPageKey: string;

	constructor(
		private browserContext: BrowserContext,
		private variantGenerator: VariantGenerator,
		private pageStorage: PageStorage,
		private elementInteractionGraph: ElementInteractionGraph,
		private visitedURLGraph: VisitedURLGraph,
		private analyzedElementStorage: AnalyzedElementStorage,
		private pageAnalyzer: PageAnalyzer
	) {
		this.lastPageKey = 'last-page';
	}

	public async crawl() {
		const _this = this;

		this.visitedURLGraph.addVisitedURLToGraph(this.browserContext.getUrl());

		this.browserContext.getWindow().addEventListener(HTMLEventType.BeforeUnload, async (e) => {
			await _this.pageStorage.set(
				_this.lastPageKey,
				_this.browserContext.getWindow().document.body.outerHTML
			);
			//A callback being called when a redirect was detected on VariantGenerator was not working, so it had to be done here
		});

		//obtem ultima interacao que não está dentro do contexto já analisado
		const lastUnanalyzed = await this.getMostRecentInteractionFromUnfinishedAnalysis(
			this.elementInteractionGraph
		);

		const previousDocument = await this.getPreviousDocument();
		await this.pageAnalyzer.analyze(
			this.browserContext.getUrl(),
			this.browserContext.getDocument(),
			previousDocument
		);

		// const analysisElement = await this.getAnalysisElement();
		// if (analysisElement) {
		// 	await this.analyse(analysisElement);
		// }

		//se ultima interacao que não está dentro do contexto já analisado está em outra página, ir para essa página
		if (
			lastUnanalyzed &&
			lastUnanalyzed.getPageUrl().href != this.browserContext.getUrl().href
		) {
			window.location.href = lastUnanalyzed.getPageUrl().href;
		}
	}

	public resetLastPage() {
		this.pageStorage.remove(this.lastPageKey);
	}

	private async getMostRecentInteractionFromUnfinishedAnalysis(
		elementInteractionGraph: ElementInteractionGraph
	): Promise<ElementInteraction<HTMLElement> | null> {
		const currentInteraction = await this.elementInteractionGraph.getLastInteraction();
		if (currentInteraction) {
			const path = await elementInteractionGraph.pathToInteraction(
				currentInteraction,
				true,
				null,
				false
			);
			const lastUnanalyzed = path.pop();
			if (lastUnanalyzed) {
				return lastUnanalyzed;
			}
		}

		return null;
	}

	private async getPreviousDocument(): Promise<HTMLDocument | null> {
		const previousHTML: string | null = await this.pageStorage.get(this.lastPageKey);
		if (previousHTML) {
			const previousDoc: Document = document.implementation.createHTMLDocument();
			previousDoc.body.innerHTML = previousHTML;
			return <HTMLDocument>previousDoc;
		}
		return null;
	}

	private async getAnalysisContextFromDiffPages(previousHTML: string): Promise<HTMLElement> {
		const previousDoc: Document = document.implementation.createHTMLDocument();
		previousDoc.body.innerHTML = previousHTML;

		const diffDomManager: DiffDomManager = new DiffDomManager(
			previousDoc.body,
			this.browserContext.getDocument().body
		);

		const xPathParentElementDiff = diffDomManager.getParentXPathOfTheOutermostElementDiff();
		const xpathResult: XPathResult | null =
			xPathParentElementDiff !== null
				? this.browserContext
						.getDocument()
						.evaluate(
							xPathParentElementDiff,
							this.browserContext.getDocument(),
							null,
							XPathResult.FIRST_ORDERED_NODE_TYPE,
							null
						)
				: null;

		return xpathResult !== null && xpathResult.singleNodeValue !== null
			? (xpathResult.singleNodeValue as HTMLElement)
			: this.browserContext.getDocument().body;
	}

	private async getAnalysisElementFromCommonAcestor(
		analysisContext: HTMLElement
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

		return ancestorElement ? ancestorElement : this.browserContext.getDocument().body;
	}

	public async analyse(contextElement: HTMLElement): Promise<Variant | null> {
		let xPath = getPathTo(contextElement);
		if (xPath) {
			const analyzedContext = await this.analyzedElementStorage.isElementAnalyzed(
				xPath,
				this.browserContext.getUrl()
			);

			if (!analyzedContext) {
				const variantsOutsideForm = await this.analyseFeatureElements(contextElement);

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

	private async analyseFeatureElements(contextElement: HTMLElement): Promise<Variant[]> {
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
					this.browserContext.getUrl()
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
}

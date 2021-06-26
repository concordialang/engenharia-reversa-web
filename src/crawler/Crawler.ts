import { DiffDomManager } from '../analysis/DiffDomManager';
import { HTMLEventType } from '../html/HTMLEventType';
import { commonAncestorElement } from '../util';
import { BrowserContext } from './BrowserContext';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractionGraph } from './ElementInteractionGraph';
import { FeatureGenerator } from './FeatureGenerator';
import { PageStorage } from '../storage/PageStorage';
import { VisitedURLGraph } from './VisitedURLGraph';
import { HTMLNodeTypes } from '../html/HTMLNodeTypes';

// TODO: Refatorar, principalmente construtor
export class Crawler {
	private lastPageKey: string;

	constructor(
		private browserContext: BrowserContext,
		private featureGenerator: FeatureGenerator,
		private pageStorage: PageStorage,
		private elementInteractionGraph: ElementInteractionGraph,
		private visitedURLGraph: VisitedURLGraph
	) {
		this.browserContext = browserContext;
		this.featureGenerator = featureGenerator;
		this.pageStorage = pageStorage;
		this.lastPageKey = 'last-page';
		this.elementInteractionGraph = elementInteractionGraph;
		this.visitedURLGraph = visitedURLGraph;
	}

	public async crawl() {
		const _this = this;

		this.visitedURLGraph.addVisitedURLToGraph(this.browserContext.getUrl());

		this.browserContext.getWindow().addEventListener(HTMLEventType.BeforeUnload, async (e) => {
			await _this.pageStorage.set(
				_this.lastPageKey,
				_this.browserContext.getWindow().document.body.outerHTML
			);
		});

		//obtem ultima interacao que não está dentro do contexto já analisado
		const lastUnanalyzed = await this.getMostRecentInteractionFromUnfinishedAnalysis(
			this.elementInteractionGraph
		);

		const analysisElement = await this.getAnalysisElement();
		if (analysisElement) {
			await this.featureGenerator.analyse(analysisElement);
		}

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

	private async getAnalysisElement(): Promise<HTMLElement> {
		let analysisElement: HTMLElement | null = null;

		const previousHTML: string | null = await this.pageStorage.get(this.lastPageKey);
		if (previousHTML) {
			const analysisContext: HTMLElement = await this.getAnalysisContextFromDiffPages(
				previousHTML
			);

			analysisElement =
				analysisContext.nodeName === HTMLNodeTypes.FORM ||
				analysisContext.nodeName === HTMLNodeTypes.TABLE
					? analysisContext
					: await this.getAnalysisElementFromCommonAcestor(analysisContext);
		} else {
			analysisElement = this.browserContext.getDocument().body;
		}

		return analysisElement;
	}

	private async getAnalysisContextFromDiffPages(previousHTML: string): Promise<HTMLElement> {
		const previousDoc: Document = document.implementation.createHTMLDocument();
		previousDoc.body.innerHTML = previousHTML;

		const diffDomManager: DiffDomManager = new DiffDomManager(
			previousDoc.body,
			this.browserContext.getDocument().body
		);

		const xPathParentElementDiff:
			| string
			| null = diffDomManager.getParentXPathOfTheOutermostElementDiff();
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
		const featureTags: NodeListOf<Element> = analysisContext.querySelectorAll('form, table');

		// find element to analyze based on body tags form and table
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
}

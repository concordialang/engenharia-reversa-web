import { HTMLEventType } from '../html/HTMLEventType';
import { BrowserContext } from './BrowserContext';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractionGraph } from './ElementInteractionGraph';
import { PageStorage } from '../storage/PageStorage';
import { VisitedURLGraph } from './VisitedURLGraph';
import { PageAnalyzer } from './PageAnalyzer';

export class Crawler {
	private lastPageKey: string;

	constructor(
		private browserContext: BrowserContext,
		private pageStorage: PageStorage,
		private elementInteractionGraph: ElementInteractionGraph,
		private visitedURLGraph: VisitedURLGraph,
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
}

import { HTMLEventType } from '../types/HTMLEventType';
import { BrowserContext } from './BrowserContext';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractionGraph } from './ElementInteractionGraph';
import { PageStorage } from '../storage/PageStorage';
import { VisitedURLGraph } from './VisitedURLGraph';
import { PageAnalyzer } from './PageAnalyzer';
import { CommunicationChannel } from '../comm/CommunicationChannel';
import { Message } from '../comm/Message';
import { Command } from '../comm/Command';
import { commonAncestorElement, getDiff, getFeatureElements, getPathTo } from '../util';
import { ElementAnalysisStorage } from '../storage/ElementAnalysisStorage';
import { ElementAnalysis } from './ElementAnalysis';
import { HTMLElementType } from '../types/HTMLElementType';
import { ElementAnalysisStatus } from './ElementAnalysisStatus';
export class Crawler {
	private lastPageKey: string;

	constructor(
		private browserContext: BrowserContext,
		private pageStorage: PageStorage,
		private elementInteractionGraph: ElementInteractionGraph,
		private visitedURLGraph: VisitedURLGraph,
		private pageAnalyzer: PageAnalyzer,
		private communicationChannel: CommunicationChannel,
		private elementAnalysisStorage: ElementAnalysisStorage
	) {
		this.lastPageKey = 'last-page';
	}

	public async crawl() {
		const _this = this;

		//this.visitedURLGraph.addVisitedURLToGraph(this.browserContext.getUrl());

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
		const analysisElement = await this.getAnalysisElement(
			this.browserContext.getDocument(),
			previousDocument
		);

		const messageResponse = await this.communicationChannel.sendMessageToAll(
			new Message([Command.GetNumberOfAvailableTabs])
		);
		let availableTabs: number = 0;
		if (messageResponse) {
			availableTabs = messageResponse.getExtra();
		} else {
			throw new Error('Error while fetching number of available tabs');
		}

		const links = await this.getUnanalyzedLinks(analysisElement);

		for (let link of links) {
			if (availableTabs > 0) {
				this.communicationChannel.sendMessageToAll(
					new Message([Command.OpenNewTab], { url: link.href })
				);
				availableTabs--;
			}
		}

		await this.pageAnalyzer.analyze(this.browserContext.getUrl(), analysisElement);
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

	private async getUnanalyzedLinks(element: HTMLElement): Promise<HTMLLinkElement[]> {
		const unanalyzedLinks: HTMLLinkElement[] = [];
		const links = element.querySelectorAll('[href]');
		for (let link of links) {
			const xPath = getPathTo(<HTMLLinkElement>link);
			if (xPath) {
				let isElementAnalyzed: boolean =
					(await this.elementAnalysisStorage.getElementAnalysisStatus(
						xPath,
						this.browserContext.getUrl()
					)) == ElementAnalysisStatus.Done;
				let insideAnalyzedElement: boolean = await this.elementAnalysisStorage.isInsideElementWithStatus(
					ElementAnalysisStatus.Done,
					<HTMLLinkElement>link,
					this.browserContext
				);
				if (!isElementAnalyzed && !insideAnalyzedElement) {
					unanalyzedLinks.push(<HTMLLinkElement>link);
				}
			} else {
				throw new Error('Unable to get element xPath');
			}
		}
		return unanalyzedLinks;
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

	private async getAnalysisElement(
		currentDocument: HTMLDocument,
		previousDocument: HTMLDocument | null = null
	): Promise<HTMLElement> {
		let analysisElement: HTMLElement | null = null;

		if (previousDocument) {
			const analysisContext: HTMLElement = await getDiff(currentDocument, previousDocument);

			analysisElement =
				analysisContext.nodeName === HTMLElementType.FORM ||
				analysisContext.nodeName === HTMLElementType.TABLE
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

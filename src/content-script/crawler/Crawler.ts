import { HTMLEventType } from '../enums/HTMLEventType';
import { BrowserContext } from './BrowserContext';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractionGraph } from './ElementInteractionGraph';
import { VisitedURLGraph } from './VisitedURLGraph';
import { PageAnalyzer } from './PageAnalyzer';
import { CommunicationChannel } from '../../shared/comm/CommunicationChannel';
import { Message } from '../../shared/comm/Message';
import { Command } from '../../shared/comm/Command';
import { commonAncestorElement, getDiff, getFormElements, getPathTo } from '../util';
import { ElementAnalysisStorage } from '../storage/ElementAnalysisStorage';
import { HTMLElementType } from '../enums/HTMLElementType';
import { ElementAnalysisStatus } from './ElementAnalysisStatus';
import { ObjectStorage } from '../storage/ObjectStorage';
export class Crawler {
	private lastPageKey: string;

	constructor(
		private browserContext: BrowserContext,
		private pageStorage: ObjectStorage<string>,
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
		const analysisElement = await this.getAnalysisElement(document, previousDocument);

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
				const analysisStatus: ElementAnalysisStatus = await this.elementAnalysisStorage.getElementAnalysisStatus(
					xPath,
					this.browserContext.getUrl()
				);
				let insideAnalyzedElement: boolean = await this.elementAnalysisStorage.isInsideElementWithStatus(
					[ElementAnalysisStatus.Done, ElementAnalysisStatus.InProgress],
					<HTMLLinkElement>link,
					this.browserContext
				);
				if (analysisStatus == ElementAnalysisStatus.Pending && !insideAnalyzedElement) {
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

	private async getPreviousDocument(): Promise<Document | null> {
		const previousHTML: string | null = await this.pageStorage.get(this.lastPageKey);
		if (previousHTML) {
			const previousDoc: Document = document.implementation.createHTMLDocument();
			previousDoc.body.innerHTML = previousHTML;
			return previousDoc;
		}
		return null;
	}

	private async getAnalysisElement(
		currentDocument: Document,
		previousDocument: Document | null = null
	): Promise<HTMLElement> {
		let analysisElement: HTMLElement | null = null;

		if (previousDocument) {
			const analysisContext: HTMLElement = await getDiff(currentDocument, previousDocument);

			analysisElement =
				analysisContext.nodeName === HTMLElementType.FORM
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
		document: Document
	): Promise<HTMLElement> {
		let ancestorElement: HTMLElement | null = null;

		const formElements: NodeListOf<Element> = getFormElements(analysisContext);

		if (formElements.length >= 1) {
			ancestorElement = commonAncestorElement(Array.from(formElements));
		} else if (formElements.length == 0) {
			const inputFieldTags = analysisContext.querySelectorAll(
				'input, select, textarea, button'
			);
			ancestorElement = commonAncestorElement(Array.from(inputFieldTags));
		}

		return ancestorElement ? ancestorElement : document.body;
	}
}
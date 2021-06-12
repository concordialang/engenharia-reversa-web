import { Graph } from '../graph/Graph';
import { GraphStorage } from '../graph/GraphStorage';
import { HTMLEventType } from '../html/HTMLEventType';
import { Mutex } from '../mutex/Mutex';
import { AnalyzedElement } from './AnalyzedElement';
import { AnalyzedElementStorage } from './AnalyzedElementStorage';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractionStorage } from './ElementInteractionStorage';
import { FeatureCreator } from './FeatureCreator';
import { Util } from '../Util';
import { ElementInteractionGraph } from './ElementInteractionGraph';
import { DiffDomManager } from '../analysis/DiffDomManager';
import { NodeTypes } from '../node/NodeTypes';
import { PageStorage } from './PageStorage';

//classe deve ser refatorada
export class Crawler {
	private document: HTMLDocument;
	private pageUrl: URL;
	private graphStorage: GraphStorage;
	//abstrair mutex em classe
	private visitedPagesGraphMutex: Mutex;
	private graphKey: string;
	private featureCreator: FeatureCreator;
	private analyzedElementStorage: AnalyzedElementStorage;
	private interactionStorage: ElementInteractionStorage;
	private interactionsGraphKey: string;
	private lastInteractionKey: string; //aux variables
	private window: Window;
	private pageStorage: PageStorage;
	private lastPageKey: string;

	private closeWindow = false;

	constructor(
		document: HTMLDocument,
		pageUrl: URL,
		graphStorage: GraphStorage,
		graphKey: string,
		mutex: Mutex,
		featureCreator: FeatureCreator,
		analyzedElementStorage: AnalyzedElementStorage,
		interactionStorage: ElementInteractionStorage,
		interactionsGraphKey: string,
		lastInteractionKey: string,
		window: Window,
		pageStorage: PageStorage,
		lastPageKey: string
	) {
		this.document = document;
		this.pageUrl = pageUrl;
		this.graphStorage = graphStorage;
		this.visitedPagesGraphMutex = mutex;
		this.graphKey = graphKey;
		this.featureCreator = featureCreator;
		this.analyzedElementStorage = analyzedElementStorage;
		this.interactionStorage = interactionStorage;
		this.interactionsGraphKey = interactionsGraphKey;
		this.lastInteractionKey = lastInteractionKey;
		this.window = window;
		this.pageStorage = pageStorage;
		this.lastPageKey = lastPageKey;
	}

	// find the most internal parent in common of nodes
	private getCommonAncestor(elements: Element[]) {
		const reducer = (prev, current) => (current.parentElement.contains(prev) ? current.parentElement : prev);
		return elements.reduce(reducer, elements[0]);
	}

	public async crawl() {
		const _this = this;
		//this.addUrlToGraph(this.pageUrl);

		this.window.addEventListener('beforeunload', async (e) => {
			await _this.pageStorage.setPage(_this.lastPageKey, _this.window.document.body.outerHTML);
		});

		const graph = this.graphStorage.get(this.interactionsGraphKey);
		let elementInteractionGraph: ElementInteractionGraph | null = null;
		if (graph) {
			elementInteractionGraph = new ElementInteractionGraph(graph, this.interactionStorage, this.analyzedElementStorage);
		}

		//obtem ultima interacao que não está dentro de form já analisado
		let lastUnanalyzed: ElementInteraction<HTMLElement> | null = null;
		if (elementInteractionGraph) {
			lastUnanalyzed = this.getLastUnanalyzedInteraction(elementInteractionGraph);
		}

		let analysisContext: HTMLElement;

		// const previousDoc = this.pageStorage.getPage(this.lastPageKey);
		// temporary for testing
		const previousDoc = document.implementation.createHTMLDocument();
		previousDoc.body.innerHTML += `<header id="menu">
				<button id="alert">Alert</button>
				<button id="confirm">Confirm</button>
				<button id="prompt">Prompt</button>
				<button id="teste">teste</button>
			</header>

			<section>
				<div>
					<div>
						<label id='labelteste' for="fname">First name:</label><br>
						<input type="text" id="fname" name="fname"><br>
					</div>
					<ul>
						<li>
							<label for="name">Name:</label>
							<input type="text" id="name" name="user_name">
						</li>
						<li>
							<label for="mail">E-mail:</label>
							<input type="text" id="mail" name="user_email">
						</li>
						<li>
							<label for="msg">Message:</label>
							<input type="text" id="msg" name="user_message"></input>
						</li>
						<li class="button">
							<button type="submit">Send your message</button>
						</li>
					</ul>
				</div>
			</section>

			<footer>
				<p>Footer</p>
			</footer>`;

		let diffDomManager = new DiffDomManager(previousDoc.body, this.document.body);
		let xPathParentElementDiff = diffDomManager.getParentXPathOfTheOutermostElementDiff();

		let xpathResult =
			xPathParentElementDiff !== null
				? this.document.evaluate(xPathParentElementDiff, this.document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
				: null;

		analysisContext =
			xpathResult !== null && xpathResult.singleNodeValue !== null
				? (xpathResult.singleNodeValue as HTMLElement)
				: this.document.body;

		let analysisElement: HTMLElement | null = null;
		const featureTags = analysisContext.querySelectorAll('form, table');

		// find element to analisy based on body tags form and table
		if (featureTags.length == 1) {
			analysisElement = featureTags[0] as HTMLElement;
		} else if (featureTags.length > 1) {
			analysisElement = this.getCommonAncestor(Array.from(featureTags));
		} else if (featureTags.length == 0) {
			let inputFieldTags = analysisContext.querySelectorAll('input, select, textarea, button');
			analysisElement = this.getCommonAncestor(Array.from(inputFieldTags));
		}

		if (analysisElement !== null) {
			await this.featureCreator.interact(analysisElement);
		}

		//se ultima interacao que não está dentro de form já analisado está em outra página, ir para essa página
		if (lastUnanalyzed && lastUnanalyzed.getPageUrl().href != this.pageUrl.href) {
			window.location.href = lastUnanalyzed.getPageUrl().href;
		}

		// const forms = analysisContext.getElementsByTagName('form');
		// console.log("forms", forms)
		// for (const form of forms) {
		// }

		// this.closeWindow = true;
	}

	//refatorar função
	private addUrlToGraph(url: URL): void {
		//mutex deveria ficar dentro de GraphStorage ou em Crawler ?
		this.visitedPagesGraphMutex
			.lock()
			.then(() => {
				let graph: Graph = this.graphStorage.get(this.graphKey);
				graph.addNode(url.toString());
				this.graphStorage.save(this.graphKey, graph);
				return this.visitedPagesGraphMutex.unlock();
			})
			.then(() => {
				if (this.closeWindow === true) window.close();
			});
	}

	private getLastUnanalyzedInteraction(
		elementInteractionGraph: ElementInteractionGraph
	): ElementInteraction<HTMLElement> | null {
		const currentInteraction = this.interactionStorage.get(this.lastInteractionKey);
		if (currentInteraction) {
			const path = elementInteractionGraph.pathToInteraction(currentInteraction, true, null, null, false);
			const lastUnanalyzed = path.pop();
			if (lastUnanalyzed) {
				return lastUnanalyzed;
			}
		}

		return null;
	}
}

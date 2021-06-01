import { Graph } from '../graph/Graph';
import { GraphStorage } from '../graph/GraphStorage';
import { HTMLEventType } from '../html/HTMLEventType';
import { Mutex } from '../mutex/Mutex';
import { AnalyzedElement } from './AnalyzedElement';
import { AnalyzedElementStorage } from './AnalyzedElementStorage';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractionStorage } from './ElementInteractionStorage';
import { FormFiller } from './FormFiller';
import { Util } from '../Util';
import { ElementInteractionGraph } from './ElementInteractionGraph';

//classe deve ser refatorada
export class Crawler {
	private document: HTMLDocument;
	private pageUrl: URL;
	private graphStorage: GraphStorage;
	//abstrair mutex em classe
	private visitedPagesGraphMutex: Mutex;
	private graphKey: string;
	private formFiller: FormFiller;
	private analyzedElementStorage: AnalyzedElementStorage;
	private interactionStorage: ElementInteractionStorage;
	private interactionsGraphKey: string;
	private lastInteractionKey: string; //aux variables
	private closeWindow = false;

	constructor(
		document: HTMLDocument,
		pageUrl: URL,
		graphStorage: GraphStorage,
		graphKey: string,
		mutex: Mutex,
		formFiller: FormFiller,
		analyzedElementStorage: AnalyzedElementStorage,
		interactionStorage: ElementInteractionStorage,
		interactionsGraphKey: string,
		lastInteractionKey: string
	) {
		this.document = document;
		this.pageUrl = pageUrl;
		this.graphStorage = graphStorage;
		this.visitedPagesGraphMutex = mutex;
		this.graphKey = graphKey;
		this.formFiller = formFiller;
		this.analyzedElementStorage = analyzedElementStorage;
		this.interactionStorage = interactionStorage;
		this.interactionsGraphKey = interactionsGraphKey;
		this.lastInteractionKey = lastInteractionKey;
	}

	public async crawl() {
		const _this = this;
		//this.addUrlToGraph(this.pageUrl);

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

		const forms = this.document.getElementsByTagName('form');
		for (const form of forms) {
			const xPath = Util.getPathTo(form);
			if (xPath) {
				if (!this.analyzedElementStorage.isElementAnalyzed(xPath, this.pageUrl)) {
					form.addEventListener(HTMLEventType.Submit, function () {
						_this.analyzedElementStorage.save(new AnalyzedElement(form, _this.pageUrl));
						this.setFormChildElementsAsAnalyzed(form);
					});

					//se ultima interacao que não está dentro de form já analisado está nessa página e também nesse form
					let previousInteractions: ElementInteraction<HTMLElement>[] = [];
					if (lastUnanalyzed && lastUnanalyzed.getPageUrl().href == this.pageUrl.href) {
						const urlCriteria = { interactionUrl: this.pageUrl, isEqual: true };
						previousInteractions =
							elementInteractionGraph?.pathToInteraction(lastUnanalyzed, false, urlCriteria, null, false) || [];
						//previousInteractions = Util.getPreviousInteractions(this.interactionStorage,edges,lastUnanalyzed,this.pageUrl,form);
						/*pega todas interações que foram feitas antes dessa ultima interação dentro desse form
						  e preenche o formulário, sem salvar no grafo, pois essas interações já foram salvas previamente
						*/
					}

					await this.formFiller.fill(form, previousInteractions.reverse());
				}
			} else {
				throw new Error('Unable to get element XPath');
			}

			//flags form element as analyzed in case it doesn't trigger the submit event
			this.analyzedElementStorage.save(new AnalyzedElement(form, this.pageUrl));
			this.setFormChildElementsAsAnalyzed(form);
		}

		//se ultima interacao que não está dentro de form já analisado está em outra página, ir para essa página
		if (lastUnanalyzed && lastUnanalyzed.getPageUrl().href != this.pageUrl.href) {
			window.location.href = lastUnanalyzed.getPageUrl().href;
		}

		//this.closeWindow = true;
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

	private setFormChildElementsAsAnalyzed(form) {
		for (let element of form.querySelectorAll('input,textarea,select,button')) {
			//o que acontece nos casos onde ocorre um clique fora do formulário durante a análise do formuĺário? aquele elemento não ficará marcado como analisado
			this.analyzedElementStorage.save(new AnalyzedElement(element, this.pageUrl));
		}
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

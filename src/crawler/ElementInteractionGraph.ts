import { Graph } from '../graph/Graph';
import { AnalyzedElementStorage } from '../storage/AnalyzedElementStorage';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractionStorage } from '../storage/ElementInteractionStorage';
import Mutex from '../mutex/Mutex';
import { GraphStorage } from '../storage/GraphStorage';

export class ElementInteractionGraph {
	private elementInteractionGraphKey: string;

	constructor(
		private elementInteractionStorage: ElementInteractionStorage,
		private analyzedElementStorage: AnalyzedElementStorage,
		private graphStorage: GraphStorage,
		private mutex: Mutex
	) {
		this.elementInteractionStorage = elementInteractionStorage;
		this.analyzedElementStorage = analyzedElementStorage;
		this.mutex = mutex;
		this.elementInteractionGraphKey = 'interactions-graph';
	}

	public async addElementInteractionToGraph(
		elementInteraction: ElementInteraction<HTMLElement>,
		sourceInteraction: ElementInteraction<HTMLElement> | null = null
	): Promise<void> {
		const interactionId = elementInteraction.getId();
		await this.elementInteractionStorage.set(interactionId, elementInteraction);
		await this.mutex.lock();
		const graph = await this.getLatestVersionOfGraph();
		graph.addNode(interactionId);
		if (sourceInteraction) {
			graph.addEdge(sourceInteraction.getId(), interactionId);
		}
		this.graphStorage.set(this.elementInteractionGraphKey, graph);
		await this.mutex.unlock();
	}

	private async getLatestVersionOfGraph(): Promise<Graph> {
		let graph: Graph | null = await this.graphStorage.get(this.elementInteractionGraphKey);
		if (!graph) {
			graph = new Graph();
		}
		return graph;
	}

	// TODO: Refatorar
	public async pathToInteraction(
		currentInteraction: ElementInteraction<HTMLElement>,
		searchForClosest: boolean,
		urlCriteria: { interactionUrl: URL; isEqual: boolean } | null,
		formCriteria: { interactionForm: HTMLFormElement; isEqual: boolean } | null,
		isInteractionAnalyzed: boolean | null = null,
		graph?: Graph
	): Promise<ElementInteraction<HTMLElement>[]> {
		const currentInteractionId = currentInteraction.getId();

		if (!graph) {
			graph = await this.getLatestVersionOfGraph();
		}

		if (currentInteractionId) {
			const nextInteractionKey = graph.getParentNodeKey(currentInteractionId);
			if (typeof nextInteractionKey === 'string') {
				const nextInteraction = await this.elementInteractionStorage.get(
					nextInteractionKey
				);

				if (!nextInteraction) {
					throw new Error('Error while fetching next interaction');
				}

				let satisfiesCriteria = true;

				if (urlCriteria) {
					const interactionUrl = nextInteraction.getPageUrl();
					const url = urlCriteria.interactionUrl;
					const urlIsEqual = urlCriteria.isEqual;
					if (urlIsEqual && url.href != interactionUrl.href) {
						satisfiesCriteria = false;
					} else if (!urlIsEqual && url.href == interactionUrl.href) {
						satisfiesCriteria = false;
					}
				}

				// if(formCriteria){
				// 	const interactionForm = currentInteraction.getElement().closest("form");
				// 	if(!interactionForm){
				// 		throw new Error("");
				// 	}
				// 	const form = formCriteria.interactionForm;
				// 	const formIsEqual = formCriteria.isEqual;
				// 	if(Util.getPathTo(interactionForm) != Util.getPathTo(form)){

				// 	}
				// }

				if (typeof isInteractionAnalyzed === 'boolean') {
					const nextInteractionElementSelector = nextInteraction.getElementSelector();
					if (!nextInteractionElementSelector)
						throw new Error('Current Interaction element selector is null');
					const interactionAnalyzed = await this.analyzedElementStorage.isElementAnalyzed(
						nextInteractionElementSelector,
						nextInteraction.getPageUrl()
					);
					if (isInteractionAnalyzed && !interactionAnalyzed) {
						satisfiesCriteria = false;
					} else if (!isInteractionAnalyzed && interactionAnalyzed) {
						satisfiesCriteria = false;
					}
				}

				if (searchForClosest && satisfiesCriteria) {
					return [currentInteraction, nextInteraction];
				} else if (!searchForClosest && !satisfiesCriteria) {
					return [currentInteraction, nextInteraction];
				}

				const nextInteractionResult = await this.pathToInteraction(
					nextInteraction,
					searchForClosest,
					urlCriteria,
					formCriteria,
					isInteractionAnalyzed,
					graph
				);

				if (!nextInteractionResult.length) {
					return [];
				}

				return [currentInteraction].concat(nextInteractionResult);
			} else if (!searchForClosest) {
				return [currentInteraction];
			} else if (nextInteractionKey === false) {
				throw new Error('Error while fetching parent interaction key');
			} else {
				return [];
			}
		} else {
			throw new Error("Current interaction doesn't have an id");
		}
	}
}

import { Graph } from '../graph/Graph';
import { AnalyzedElementStorage } from '../storage/AnalyzedElementStorage';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractionStorage } from '../storage/ElementInteractionStorage';
import Mutex from '../mutex/Mutex';
import { GraphStorage } from '../storage/GraphStorage';

export class ElementInteractionGraph {
	private elementInteractionGraphKey: string;
	private lastInteractionKey: string;

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
		this.lastInteractionKey = 'last-interaction';
	}

	public async addElementInteractionToGraph(
		elementInteraction: ElementInteraction<HTMLElement>
	): Promise<void> {
		const interactionId = elementInteraction.getId();
		await this.elementInteractionStorage.set(interactionId, elementInteraction);
		await this.mutex.lock();
		const graph = await this.getLatestVersionOfGraph();
		graph.addNode(interactionId);
		const sourceInteraction = await this.getLastInteraction();
		if (sourceInteraction) {
			graph.addEdge(sourceInteraction.getId(), interactionId);
		}
		this.graphStorage.set(this.elementInteractionGraphKey, graph);
		await this.elementInteractionStorage.set(this.lastInteractionKey, elementInteraction);
		await this.mutex.unlock();
	}

	private async getLatestVersionOfGraph(): Promise<Graph> {
		let graph: Graph | null = await this.graphStorage.get(this.elementInteractionGraphKey);
		if (!graph) {
			graph = new Graph();
		}
		return graph;
	}

	//FIXME Colocar opções em um JSON
	public async pathToInteraction(
		currentInteraction: ElementInteraction<HTMLElement>,
		searchForClosest: boolean,
		urlCriteria: { interactionUrl: URL; isEqual: boolean } | null,
		isInteractionAnalyzed: boolean | null = null,
		graph?: Graph
	): Promise<ElementInteraction<HTMLElement>[]> {
		const currentInteractionId = currentInteraction.getId();

		if (!graph) {
			graph = await this.getLatestVersionOfGraph();
		}

		if (!currentInteractionId) {
			throw new Error("Current interaction doesn't have an id");
		}

		const nextInteractionKey = graph.getParentNodeKey(currentInteractionId);

		if (nextInteractionKey === null) {
			if (!searchForClosest) {
				return [currentInteraction];
			} else {
				return [];
			}
		}

		const nextInteraction = await this.elementInteractionStorage.get(nextInteractionKey);

		if (!nextInteraction) {
			throw new Error('Error while fetching next interaction');
		}

		let satisfiesCriteria = true;

		if (urlCriteria) {
			satisfiesCriteria = this.interactionSatisfiesUrlCriteria(nextInteraction, urlCriteria);
		}

		if (satisfiesCriteria && typeof isInteractionAnalyzed === 'boolean') {
			satisfiesCriteria = await this.interactionSatisfiesAnalysisCriteria(
				nextInteraction,
				isInteractionAnalyzed
			);
		}

		if ((searchForClosest && satisfiesCriteria) || (!searchForClosest && !satisfiesCriteria)) {
			return [currentInteraction, nextInteraction];
		}

		const nextInteractionResult = await this.pathToInteraction(
			nextInteraction,
			searchForClosest,
			urlCriteria,
			isInteractionAnalyzed,
			graph
		);

		if (!nextInteractionResult.length) {
			return [];
		}

		return [currentInteraction].concat(nextInteractionResult);
	}

	private interactionSatisfiesUrlCriteria(
		interaction: ElementInteraction<HTMLElement>,
		urlCriteria: { interactionUrl: URL; isEqual: boolean }
	): boolean {
		const interactionUrl = interaction.getPageUrl();
		const url = urlCriteria.interactionUrl;
		const urlIsEqual = urlCriteria.isEqual;
		if (
			(urlIsEqual && url.href != interactionUrl.href) ||
			(!urlIsEqual && url.href == interactionUrl.href)
		) {
			return false;
		}
		return true;
	}

	private async interactionSatisfiesAnalysisCriteria(
		interaction: ElementInteraction<HTMLElement>,
		isInteractionAnalyzed: boolean
	): Promise<boolean> {
		const nextInteractionElementSelector = interaction.getElementSelector();
		if (!nextInteractionElementSelector)
			throw new Error('Current Interaction element selector is null');
		const interactionAnalyzed = await this.analyzedElementStorage.isElementAnalyzed(
			nextInteractionElementSelector,
			interaction.getPageUrl()
		);
		if (
			(isInteractionAnalyzed && !interactionAnalyzed) ||
			(!isInteractionAnalyzed && interactionAnalyzed)
		) {
			return false;
		}

		return true;
	}

	public async getLastInteraction(): Promise<ElementInteraction<HTMLElement> | null> {
		return await this.elementInteractionStorage.get(this.lastInteractionKey);
	}
}

import { ElementAnalysisStatus } from "../../content-script/crawler/ElementAnalysisStatus";
import { ElementInteraction } from "../../content-script/crawler/ElementInteraction";
import { Graph } from "../../content-script/graph/Graph";
import { ElementAnalysisStorage } from "../../content-script/storage/ElementAnalysisStorage";
import { ObjectStorage } from "../../shared/storage/ObjectStorage";
import { GraphStorage } from "../storage/GraphStorage";

export class ElementInteractionGraph {
	private elementInteractionGraphKey: string;
	private lastInteractionKey: string;

	constructor(
		private id: string,
		private elementInteractionStorage: ObjectStorage<ElementInteraction<HTMLElement>>,
		private elementAnalysisStorage: ElementAnalysisStorage,
		private graphStorage: GraphStorage 
	) {
		this.id = id;
		this.elementInteractionStorage = elementInteractionStorage;
		this.elementAnalysisStorage = elementAnalysisStorage;
		this.elementInteractionGraphKey = 'interactions-graph-' + this.id;
		this.lastInteractionKey = 'last-interaction-' + this.id;
	}

	public async addElementInteractionToGraph(
		elementInteraction: ElementInteraction<HTMLElement>
	): Promise<void> {
		const interactionId = elementInteraction.getId();
		console.log(interactionId);
		await this.elementInteractionStorage.set(interactionId, elementInteraction);
		const graph = await this.getLatestVersionOfGraph();
		console.log("asddsadsa");
		console.log(graph);
		console.log(typeof graph);
		if (graph.nodeExists(interactionId)) {
			return;
		}
		graph.addNode(interactionId);
		console.log("p2423423");
		const sourceInteraction = await this.getLastInteraction();
		console.log("32cv1x3c2v1x32cv1x");
		if (sourceInteraction) {
			graph.addEdge(sourceInteraction.getId(), interactionId);
		}
		
		this.graphStorage.set(this.elementInteractionGraphKey, graph);
		await this.elementInteractionStorage.set(this.lastInteractionKey, elementInteraction);
		console.log("added to graph");
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

		const satisfiesCriteria = await this.satisfiesCriteria(
			nextInteraction,
			urlCriteria,
			isInteractionAnalyzed
		);

		if (searchForClosest && satisfiesCriteria) {
			return [currentInteraction, nextInteraction];
		} else if (!searchForClosest && !satisfiesCriteria) {
			if (
				await this.satisfiesCriteria(currentInteraction, urlCriteria, isInteractionAnalyzed)
			) {
				return [currentInteraction];
			} else {
				return [];
			}
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

	private async satisfiesCriteria(
		interaction: ElementInteraction<HTMLElement>,
		urlCriteria: { interactionUrl: URL; isEqual: boolean } | null,
		isInteractionAnalyzed: boolean | null = null
	): Promise<boolean> {
		let satisfiesCriteria = true;

		if (urlCriteria) {
			satisfiesCriteria = this.interactionSatisfiesUrlCriteria(interaction, urlCriteria);
		}

		if (satisfiesCriteria && typeof isInteractionAnalyzed === 'boolean') {
			satisfiesCriteria = await this.interactionSatisfiesAnalysisCriteria(
				interaction,
				isInteractionAnalyzed
			);
		}

		return satisfiesCriteria;
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
		const analysisStatus = await this.elementAnalysisStorage.getElementAnalysisStatus(
			nextInteractionElementSelector,
			interaction.getPageUrl()
		);
		if (
			(isInteractionAnalyzed && analysisStatus == ElementAnalysisStatus.Pending) ||
			(!isInteractionAnalyzed && analysisStatus != ElementAnalysisStatus.Pending)
		) {
			return false;
		}

		return true;
	}

	public async getPreviousInteraction(
		interaction: ElementInteraction<HTMLElement>
	): Promise<ElementInteraction<HTMLElement> | null> {
		const graph = await this.getLatestVersionOfGraph();
		if (graph) {
			const parentNodeKey = graph.getParentNodeKey(interaction.getId());
			if (parentNodeKey) {
				return this.elementInteractionStorage.get(parentNodeKey);
			}
		}
		return null;
	}

	public async getNextInteraction(
		interaction: ElementInteraction<HTMLElement>
	): Promise<ElementInteraction<HTMLElement> | null> {
		const graph = await this.getLatestVersionOfGraph();
		if (graph) {
			const childNodeKey = graph.getChildNodeKey(interaction.getId());
			if (childNodeKey) {
				return this.elementInteractionStorage.get(childNodeKey);
			}
		}
		return null;
	}

	public async isNextInteractionOnAnotherPage(
		interaction: ElementInteraction<HTMLElement>
	): Promise<boolean> {
		const nextInteraction = await this.getNextInteraction(interaction);
		if (nextInteraction) {
			return nextInteraction.getPageUrl().href != interaction.getPageUrl().href;
		}
		return false;
	}

	public async getLastInteraction(): Promise<ElementInteraction<HTMLElement> | null> {
		return await this.elementInteractionStorage.get(this.lastInteractionKey);
	}

	public async clean(): Promise<void> {
		await this.graphStorage.remove(this.elementInteractionGraphKey);
	}
}













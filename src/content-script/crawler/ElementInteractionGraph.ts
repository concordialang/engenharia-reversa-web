import { Graph } from '../graph/Graph';
import { ElementAnalysisStorage } from '../storage/ElementAnalysisStorage';
import { ElementInteraction } from './ElementInteraction';
import { GraphStorage } from '../storage/GraphStorage';
import { ElementAnalysisStatus } from './ElementAnalysisStatus';
import { ObjectStorage } from '../storage/ObjectStorage';
import { PageAnalysisStorage } from '../storage/PageAnalysisStorage';
import { PageAnalysisStatus } from './PageAnalysisStatus';
import { getURLasString } from '../util';
import { Feature } from '../spec-analyser/Feature';
import { Config } from '../../shared/config';

export class ElementInteractionGraph {
	private elementInteractionGraphKey: string;
	private lastInteractionKey: string;

	constructor(
		private id: string,
		private elementInteractionStorage: ObjectStorage<ElementInteraction<HTMLElement>>,
		private elementAnalysisStorage: ElementAnalysisStorage,
		private graphStorage: GraphStorage,
		private pageAnalysisStorage: PageAnalysisStorage,
		private featureStorage: ObjectStorage<Feature>,
		private config: Config,
	) {
		this.id = id;
		this.elementInteractionStorage = elementInteractionStorage;
		this.elementAnalysisStorage = elementAnalysisStorage;
		this.elementInteractionGraphKey = 'interactions-graph-' + this.id;
		this.lastInteractionKey = 'last-interaction-' + this.id;
		this.pageAnalysisStorage = pageAnalysisStorage;
		this.featureStorage = featureStorage;
		this.config = config;
	}

	public async addElementInteractionToGraph(
		elementInteraction: ElementInteraction<HTMLElement>
	): Promise<void> {
		const interactionId = elementInteraction.getId();
		await this.elementInteractionStorage.set(interactionId, elementInteraction);
		const graph = await this.getLatestVersionOfGraph();
		if (graph.nodeExists(interactionId)) {
			return;
		}
		graph.addNode(interactionId);
		const sourceInteraction = await this.getLastInteraction();
		if (sourceInteraction) {
			graph.addEdge(sourceInteraction.getId(), interactionId);
		}
		this.graphStorage.set(this.elementInteractionGraphKey, graph);
		await this.elementInteractionStorage.set(this.lastInteractionKey, elementInteraction);
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
		isInteractionElementAnalyzed: boolean | null = null,
		isInteractionPageAnalyzed: boolean | null = null,
		graph?: Graph,
		interactionFeatureNeedsNewVariant: boolean | null = null
	): Promise<ElementInteraction<HTMLElement>[]> {
		const currentInteractionId = currentInteraction.getId();

		if (!graph) {
			graph = await this.getLatestVersionOfGraph();
			//@ts-ignore
			const keys = graph.serialize().nodes;
			for(let key of keys) {
			}
			//@ts-ignore
			const links = graph.serialize().links;
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
			isInteractionElementAnalyzed,
			isInteractionPageAnalyzed,
			interactionFeatureNeedsNewVariant
		);

		if (searchForClosest && satisfiesCriteria) {
			return [currentInteraction, nextInteraction];
		} else if (!searchForClosest && !satisfiesCriteria) {
			if (
				await this.satisfiesCriteria(currentInteraction, urlCriteria, isInteractionElementAnalyzed, isInteractionPageAnalyzed)
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
			isInteractionElementAnalyzed,
			isInteractionPageAnalyzed,
			graph,
			interactionFeatureNeedsNewVariant
		);

		if (!nextInteractionResult.length) {
			return [];
		}

		return [currentInteraction].concat(nextInteractionResult);
	}

	private async satisfiesCriteria(
		interaction: ElementInteraction<HTMLElement>,
		urlCriteria: { interactionUrl: URL; isEqual: boolean } | null,
		isInteractionElementAnalyzed: boolean | null = null,
		isInteractionPageAnalyzed: boolean | null = null,
		interactionFeatureNeedsNewVariant: boolean | null = null,
	): Promise<boolean> {
		let satisfiesCriteria = true;

		if (urlCriteria) {
			satisfiesCriteria = this.interactionSatisfiesUrlCriteria(interaction, urlCriteria);
		}

		if (satisfiesCriteria && typeof isInteractionElementAnalyzed === 'boolean') {
			satisfiesCriteria = await this.interactionSatisfiesElementAnalysisCriteria(
				interaction,
				isInteractionElementAnalyzed
			);
		}

		if (satisfiesCriteria && typeof isInteractionPageAnalyzed === 'boolean') {
			satisfiesCriteria = await this.interactionSatisfiesPageAnalysisCriteria(
				interaction,
				isInteractionPageAnalyzed
			);
		}

		if (satisfiesCriteria && typeof interactionFeatureNeedsNewVariant === 'boolean') {
			satisfiesCriteria = await this.interactionSatisfiesFeatureCriteria(
				interaction,
				interactionFeatureNeedsNewVariant
			);
		}

		return satisfiesCriteria;
	}

	private interactionSatisfiesUrlCriteria(
		interaction: ElementInteraction<HTMLElement>,
		urlCriteria: { interactionUrl: URL; isEqual: boolean }
	): boolean {
		const interactionUrl = getURLasString(interaction.getPageUrl(), this.config);
		const url = getURLasString(urlCriteria.interactionUrl, this.config);
		const urlIsEqual = urlCriteria.isEqual;
		if (
			(urlIsEqual && url != interactionUrl) ||
			(!urlIsEqual && url == interactionUrl)
		) {
			return false;
		}
		return true;
	}

	private async interactionSatisfiesElementAnalysisCriteria(
		interaction: ElementInteraction<HTMLElement>,
		isElementAnalyzed: boolean
	): Promise<boolean> {
		const nextInteractionElementSelector = interaction.getElementSelector();
		if (!nextInteractionElementSelector)
			throw new Error('Current Interaction element selector is null');
		const analysisStatus = await this.elementAnalysisStorage.getElementAnalysisStatus(
			nextInteractionElementSelector,
			interaction.getPageUrl()
		);
		if (
			(isElementAnalyzed && analysisStatus == ElementAnalysisStatus.Pending) ||
			(!isElementAnalyzed && analysisStatus != ElementAnalysisStatus.Pending)
		) {
			return false;
		}

		return true;
	}

	private async interactionSatisfiesPageAnalysisCriteria(
		interaction: ElementInteraction<HTMLElement>,
		isPageAnalyzed: boolean
	): Promise<boolean> {
		const nextInteractionUrl = interaction.getPageUrl();
		const analysisStatus = await this.pageAnalysisStorage.getPageAnalysisStatus(
			nextInteractionUrl
		);
		if (
			(!isPageAnalyzed && analysisStatus == PageAnalysisStatus.Done) ||
			(isPageAnalyzed && analysisStatus == PageAnalysisStatus.Done)
		) {
			return false;
		}

		return true;
	}

	private async interactionSatisfiesFeatureCriteria(
		interaction: ElementInteraction<HTMLElement>,
		interactionFeatureNeedsNewVariant: boolean
	): Promise<boolean> {
		let nextInteractionFeature : Feature | string | null = interaction.getFeature();
		if(typeof nextInteractionFeature === 'string'){
			nextInteractionFeature = await this.featureStorage.get(nextInteractionFeature);
		}
		if(nextInteractionFeature){
			//@ts-ignore
			const needNewVariants = nextInteractionFeature.needNewVariants;
			if (
				(interactionFeatureNeedsNewVariant && !needNewVariants) ||
				(!interactionFeatureNeedsNewVariant && needNewVariants)
			) {
				return false;
			}
	
			return true;
		} else {
			throw new Error('Next Interaction feature is null');
		}
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
			return getURLasString(nextInteraction.getPageUrl(), this.config) != getURLasString(interaction.getPageUrl(), this.config);
		}
		return false;
	}

	public async getLastInteraction(): Promise<ElementInteraction<HTMLElement> | null> {
		return this.elementInteractionStorage.get(this.lastInteractionKey);
	}

	public async clean(): Promise<void> {
		await this.graphStorage.remove(this.elementInteractionGraphKey);
	}
}

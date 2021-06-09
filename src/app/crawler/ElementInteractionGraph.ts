import { Graph } from '../graph/Graph';
import { Util } from '../Util';
import { AnalyzedElementStorage } from './AnalyzedElementStorage';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractionStorage } from './ElementInteractionStorage';

export class ElementInteractionGraph {
	private graph: Graph;
	private elementInteractionStorage: ElementInteractionStorage;
	private analyzedElementStorage: AnalyzedElementStorage;

	constructor(
		graph: Graph,
		elementInteractionStorage: ElementInteractionStorage,
		analyzedElementStorage: AnalyzedElementStorage
	) {
		this.graph = graph;
		this.elementInteractionStorage = elementInteractionStorage;
		this.analyzedElementStorage = analyzedElementStorage;
	}

	public pathToInteraction(
		currentInteraction: ElementInteraction<HTMLElement>,
		searchForClosest: boolean,
		urlCriteria: { interactionUrl: URL; isEqual: boolean } | null,
		formCriteria: { interactionForm: HTMLFormElement; isEqual: boolean } | null,
		isInteractionAnalyzed: boolean | null = null
	): ElementInteraction<HTMLElement>[] {
		const currentInteractionId = currentInteraction.getId();

		if (currentInteractionId == '6g9b1c8dga204') {
			const a = 'dsasd';
		}

		if (currentInteractionId) {
			const nextInteractionKey = this.graph.getParentNodeKey(currentInteractionId);
			if (typeof nextInteractionKey === 'string') {
				const nextInteraction = this.elementInteractionStorage.get(nextInteractionKey);

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
					if (!nextInteractionElementSelector) throw new Error('Current Interaction element selector is null');
					const interactionAnalyzed = this.analyzedElementStorage.isElementAnalyzed(
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

				const nextInteractionResult = this.pathToInteraction(
					nextInteraction,
					searchForClosest,
					urlCriteria,
					formCriteria,
					isInteractionAnalyzed
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

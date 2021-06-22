import { Graph } from '../graph/Graph';
import { GraphStorage } from '../storage/GraphStorage';
import { HTMLElementType } from '../html/HTMLElementType';
import { HTMLInputType } from '../html/HTMLInputType';
import Mutex from '../mutex/Mutex';
import { sleep } from '../util';
import { ButtonInteractor } from './ButtonInteractor';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractionStorage } from '../storage/ElementInteractionStorage';
import { InputInteractor } from './InputInteractor';
import { InteractionResult } from './InteractionResult';

// TODO: Refatorar essa classe, sobretudo o construtor
export class ElementInteractionManager {
	private inputInteractor: InputInteractor;
	private buttonInteractor: ButtonInteractor;
	private elementInteractionGraphKey: string;
	private graphStorage: GraphStorage;
	private elementInteractionStorage: ElementInteractionStorage;
	private mutex: Mutex;
	private lastInteraction: ElementInteraction<HTMLElement> | null;
	private lastInteractionKey: string;

	constructor(
		inputInteractor: InputInteractor,
		buttonInteractor: ButtonInteractor,
		elementInteractionGraphKey: string,
		graphStorage: GraphStorage,
		elementInteractionStorage: ElementInteractionStorage,
		mutex: Mutex,
		lastInteractionKey: string
	) {
		this.inputInteractor = inputInteractor;
		this.buttonInteractor = buttonInteractor;
		this.elementInteractionGraphKey = elementInteractionGraphKey;
		this.graphStorage = graphStorage;
		this.elementInteractionStorage = elementInteractionStorage;
		this.mutex = mutex;
		this.lastInteractionKey = lastInteractionKey;
		this.lastInteraction = null;
	}

	public async execute(
		interaction: ElementInteraction<HTMLElement>,
		saveInteractionInGraph: boolean = true,
		previousInteraction: ElementInteraction<HTMLElement> | null = null
	): Promise<InteractionResult | null> {
		await sleep(400);
		const element = interaction.getElement();
		const type = element.tagName;
		let result: InteractionResult | null = null;
		if (type == HTMLElementType.Input) {
			const inputType = element.getAttribute('type');
			if (inputType == HTMLInputType.Submit) {
				result = await this.buttonInteractor.execute(
					<ElementInteraction<HTMLButtonElement>>interaction
				);
			} else {
				result = await this.inputInteractor.execute(
					<ElementInteraction<HTMLInputElement>>interaction
				);
			}
		} else if (type == HTMLElementType.Button) {
			result = await this.buttonInteractor.execute(
				<ElementInteraction<HTMLButtonElement>>interaction
			);
		}
		//Verificar se essa interação já foi salva ?
		if (saveInteractionInGraph) {
			const id = interaction.getId();
			await this.elementInteractionStorage.set(id, interaction);
			await this.mutex.lock();
			await this.addElementInteractionKeyToGraph(id);
			if (previousInteraction) {
				const previousInteractionId = previousInteraction.getId();
				if (previousInteractionId) {
					await this.addElementInteractionKeyLinkToGraph(previousInteractionId, id);
				} else {
					throw new Error(
						'Previous element interaction needs an id to be linked to the current element interaction'
					);
				}
			}
			this.mutex.unlock();
		}

		this.lastInteraction = interaction;
		await this.elementInteractionStorage.set(this.lastInteractionKey, interaction);

		return result;
	}

	public getLastInteraction(): ElementInteraction<HTMLElement> | null {
		return this.lastInteraction;
	}

	public executeInteractions(interactions: ElementInteraction<HTMLElement>[]) {
		for (const interaction of interactions) {
			this.execute(interaction, false);
		}
	}

	//refatorar função
	private async addElementInteractionKeyToGraph(key: string): Promise<void> {
		let graph: Graph | null = await this.graphStorage.get(this.elementInteractionGraphKey);
		if (!graph) {
			graph = new Graph();
		}
		graph.addNode(key);
		await this.graphStorage.set(this.elementInteractionGraphKey, graph);
	}

	//refatorar função
	private async addElementInteractionKeyLinkToGraph(
		keyFrom: string,
		keyTo: string
	): Promise<void> {
		let graph: Graph | null = await this.graphStorage.get(this.elementInteractionGraphKey);
		if (!graph) {
			graph = new Graph();
		}
		graph.addEdge(keyFrom, keyTo);
		await this.graphStorage.set(this.elementInteractionGraphKey, graph);
	}
}

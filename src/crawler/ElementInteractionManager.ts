import { Graph } from '../graph/Graph';
import { GraphStorage } from '../graph/GraphStorage';
import { HTMLElementType } from '../html/HTMLElementType';
import { HTMLInputType } from '../html/HTMLInputType';
import Mutex from '../mutex/Mutex';
import { sleep } from '../util';
import { ButtonInteractor } from './ButtonInteractor';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractionStorage } from './ElementInteractionStorage';
import { InputInteractor } from './InputInteractor';
import { InteractionResult } from './InteractionResult';

// TO-DO: Refatorar essa classe, sobretudo o construtor
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
		// console.log(element);
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
			this.elementInteractionStorage.save(id, interaction);
			await this.mutex.lock();
			this.addElementInteractionKeyToGraph(id);
			if (previousInteraction) {
				const previousInteractionId = previousInteraction.getId();
				if (previousInteractionId) {
					this.addElementInteractionKeyLinkToGraph(previousInteractionId, id);
				} else {
					throw new Error(
						'Previous element interaction needs an id to be linked to the current element interaction'
					);
				}
			}
			this.mutex.unlock();
		}

		this.lastInteraction = interaction;
		this.elementInteractionStorage.save(this.lastInteractionKey, interaction);

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
	private addElementInteractionKeyToGraph(key: string): void {
		let graph: Graph = this.graphStorage.get(this.elementInteractionGraphKey);
		graph.addNode(key);
		this.graphStorage.save(this.elementInteractionGraphKey, graph);
	}

	//refatorar função
	private addElementInteractionKeyLinkToGraph(keyFrom: string, keyTo: string): void {
		let graph: Graph = this.graphStorage.get(this.elementInteractionGraphKey);
		graph.addEdge(keyFrom, keyTo);
		this.graphStorage.save(this.elementInteractionGraphKey, graph);
	}
}

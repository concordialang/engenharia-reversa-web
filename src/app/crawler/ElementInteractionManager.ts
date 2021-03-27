import { GraphStorage } from '../graph/GraphStorage';
import { HTMLElementType } from '../html/HTMLElementType';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractor } from './ElementInteractor';
import { v4 as uuid } from 'uuid';
import { ElementInteractionStorage } from './ElementInteractionStorage';
import { Mutex } from '../mutex/Mutex';
import { Graph } from '../graph/Graph';
import { InputInteractor } from './InputInteractor';
import { ButtonInteractor } from './ButtonInteractor';

export class ElementInteractionManager {
	private inputInteractor: InputInteractor;
	private buttonInteractor: ButtonInteractor;
	private elementInteractionGraphKey: string;
	private graphStorage: GraphStorage;
	private elementInteractionStorage: ElementInteractionStorage;
	private mutex: Mutex;
	//private lastInteraction: ElementInteraction<HTMLElement> | null;

	constructor(
		inputInteractor: InputInteractor,
		buttonInteractor: ButtonInteractor,
		elementInteractionGraphKey: string,
		graphStorage: GraphStorage,
		elementInteractionStorage: ElementInteractionStorage,
		mutex: Mutex
	) {
		this.inputInteractor = inputInteractor;
		this.buttonInteractor = buttonInteractor;
		this.elementInteractionGraphKey = elementInteractionGraphKey;
		this.graphStorage = graphStorage;
		this.elementInteractionStorage = elementInteractionStorage;
		this.mutex = mutex;
	}

	public async execute(
		interaction: ElementInteraction<HTMLElement>,
		saveInteractionInGraph: boolean = true
	): Promise<void> {
		await this.delay(400);
		const element = interaction.getElement();
		const type = element.tagName;
		if (type == HTMLElementType.Input) {
			this.inputInteractor.execute(
				<ElementInteraction<HTMLInputElement>>interaction
			);
		} else if (
			type == HTMLElementType.Button &&
			element.getAttribute('type') != 'submit'
		) {
			this.buttonInteractor.execute(
				<ElementInteraction<HTMLButtonElement>>interaction
			);
		}
		//Verificar se essa interação já foi salva ?
		if (saveInteractionInGraph) {
			const id = uuid();
			const key = interaction.getPageUrl().href + ':' + id;
			this.elementInteractionStorage.save(key, interaction);
			this.mutex.lock().then(() => {
				const graph = this.graphStorage.get(
					this.elementInteractionGraphKey
				);
				const depthFirstSearch = graph.depthFirstSearch();
				console.log(depthFirstSearch);
				if (depthFirstSearch.length) {
					const lastInteractionId = depthFirstSearch[0];
					console.log(key);
					if (lastInteractionId) {
						this.addElementInteractionKeyToGraph(key);
						this.addElementInteractionKeyLinkToGraph(
							lastInteractionId,
							key
						);
					} else {
						throw new Error(
							'Last element interaction needs an id to be linked to the current element interaction'
						);
					}
				} else {
					this.addElementInteractionKeyToGraph(key);
				}
				return this.mutex.unlock();
			});
		}
	}

	private delay(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	public executeInteractions(
		interactions: ElementInteraction<HTMLElement>[]
	) {
		for (const interaction of interactions) {
			this.execute(interaction, false);
		}
	}

	//refatorar função
	private addElementInteractionKeyToGraph(key: string): void {
		let graph: Graph = this.graphStorage.get(
			this.elementInteractionGraphKey
		);
		graph.addNode(key);
		this.graphStorage.save(this.elementInteractionGraphKey, graph);
	}

	//refatorar função
	private addElementInteractionKeyLinkToGraph(
		keyFrom: string,
		keyTo: string
	): void {
		let graph: Graph = this.graphStorage.get(
			this.elementInteractionGraphKey
		);
		graph.addEdge(keyFrom, keyTo);
		this.graphStorage.save(this.elementInteractionGraphKey, graph);
	}
}

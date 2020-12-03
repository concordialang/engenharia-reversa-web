import { GraphStorage } from '../graph/GraphStorage';
import { HTMLElementType } from '../html/HTMLElementType';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractor } from './ElementInteractor';
import { v4 as uuid } from 'uuid';
import { ElementInteractionStorage } from './ElementInteractionStorage';
import { Mutex } from '../mutex/Mutex';
import { Graph } from '../graph/Graph';

export class ElementInteractionManager {
	private inputInteractor: ElementInteractor<HTMLInputElement>;
	private elementInteractionGraphKey: string;
	private graphStorage: GraphStorage;
	private elementInteractionStorage: ElementInteractionStorage;
	private mutex: Mutex;
	private lastInteraction: ElementInteraction<HTMLElement> | null;

	constructor(
		inputInteractor: ElementInteractor<HTMLInputElement>,
		elementInteractionGraphKey: string,
		graphStorage: GraphStorage,
		elementInteractionStorage: ElementInteractionStorage,
		mutex: Mutex
	) {
		this.inputInteractor = inputInteractor;
		this.elementInteractionGraphKey = elementInteractionGraphKey;
		this.graphStorage = graphStorage;
		this.elementInteractionStorage = elementInteractionStorage;
		this.mutex = mutex;
		this.lastInteraction = null;
	}

	/* REFATORAR, pageUrl deve ficar na assinatura do método ou dentro de ElementInteraction ?*/
	public execute(
		interaction: ElementInteraction<HTMLElement>,
		saveInteractionInGraph: boolean = true
	): void {
		const element = interaction.getElement();
		const type = element.tagName;
		if (type == HTMLElementType.Input) {
			this.inputInteractor.execute(
				<ElementInteraction<HTMLInputElement>>interaction
			);
		}
		//Verificar se essa interação já foi salva ?
		if (saveInteractionInGraph) {
			const id = uuid();
			const key = interaction.getPageUrl().href + ':' + id;
			this.elementInteractionStorage.save(key, interaction);
			this.addElementInteractionKeyToGraph(key);
			if (this.lastInteraction) {
				const lastInteractionId = this.lastInteraction.getId();
				if (lastInteractionId) {
					this.addElementInteractionKeyLinkToGraph(
						lastInteractionId,
						key
					);
				} else {
					throw new Error(
						'Last element interaction needs an id to be linked to the current element interaction'
					);
				}
			}
			const updatedInteraction = new ElementInteraction<HTMLElement>(
				interaction.getElement(),
				interaction.getEventType(),
				interaction.getPageUrl(),
				interaction.getValue(),
				key
			);
			this.lastInteraction = updatedInteraction;
			console.log(this.lastInteraction);
		} else {
			this.lastInteraction = interaction;
		}
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
		//mutex deveria ficar dentro de GraphStorage ou em ElementInteractionManager ?
		this.mutex.lock().then(() => {
			let graph: Graph = this.graphStorage.get(
				this.elementInteractionGraphKey
			);
			graph.addNode(key);
			this.graphStorage.save(this.elementInteractionGraphKey, graph);
			return this.mutex.unlock();
		});
	}

	//refatorar função
	private addElementInteractionKeyLinkToGraph(
		keyFrom: string,
		keyTo: string
	): void {
		//mutex deveria ficar dentro de GraphStorage ou em ElementInteractionManager ?
		this.mutex.lock().then(() => {
			let graph: Graph = this.graphStorage.get(
				this.elementInteractionGraphKey
			);
			graph.addEdge(keyFrom, keyTo);
			this.graphStorage.save(this.elementInteractionGraphKey, graph);
			return this.mutex.unlock();
		});
	}
}

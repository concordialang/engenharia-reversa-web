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
import { ElementInteractionGraph } from './ElementInteractionGraph';

// TODO: Refatorar essa classe, sobretudo o construtor
export class ElementInteractionManager {
	private inputInteractor: InputInteractor;
	private buttonInteractor: ButtonInteractor;
	private elementInteractionStorage: ElementInteractionStorage;
	private mutex: Mutex;
	private lastInteraction: ElementInteraction<HTMLElement> | null;
	private lastInteractionKey: string;

	constructor(
		inputInteractor: InputInteractor,
		buttonInteractor: ButtonInteractor,
		private elementInteractionGraph: ElementInteractionGraph,
		elementInteractionStorage: ElementInteractionStorage,
		mutex: Mutex,
		lastInteractionKey: string
	) {
		this.inputInteractor = inputInteractor;
		this.buttonInteractor = buttonInteractor;
		this.elementInteractionGraph = elementInteractionGraph;
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
			await this.elementInteractionGraph.addElementInteractionToGraph(
				interaction,
				previousInteraction
			);
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
}

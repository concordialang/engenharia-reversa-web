import { HTMLElementType } from '../html/HTMLElementType';
import { HTMLInputType } from '../html/HTMLInputType';
import { sleep } from '../util';
import { ButtonInteractor } from './ButtonInteractor';
import { ElementInteraction } from './ElementInteraction';
import { InputInteractor } from './InputInteractor';
import { InteractionResult } from './InteractionResult';
import { ElementInteractionGraph } from './ElementInteractionGraph';

// TODO: Refatorar essa classe
export class ElementInteractionManager {
	constructor(
		private inputInteractor: InputInteractor,
		private buttonInteractor: ButtonInteractor,
		private elementInteractionGraph: ElementInteractionGraph
	) {
		this.inputInteractor = inputInteractor;
		this.buttonInteractor = buttonInteractor;
		this.elementInteractionGraph = elementInteractionGraph;
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

		if (saveInteractionInGraph) {
			await this.elementInteractionGraph.addElementInteractionToGraph(
				interaction,
				previousInteraction
			);
		}

		return result;
	}

	public executeInteractions(interactions: ElementInteraction<HTMLElement>[]) {
		for (const interaction of interactions) {
			this.execute(interaction, false);
		}
	}
}

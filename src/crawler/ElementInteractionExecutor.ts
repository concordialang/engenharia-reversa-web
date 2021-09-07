import { HTMLElementType } from '../types/HTMLElementType';
import { HTMLInputType } from '../types/HTMLInputType';
import { sleep } from '../util';
import { ButtonInteractor } from './ButtonInteractor';
import { ElementInteraction } from './ElementInteraction';
import { InputInteractor } from './InputInteractor';
import { InteractionResult } from './InteractionResult';
import { ElementInteractionGraph } from './ElementInteractionGraph';

// TODO: Refatorar essa classe
export class ElementInteractionExecutor {
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
		redirectionCallback?: (interaction: ElementInteraction<HTMLElement>) => Promise<void>,
		saveInteractionInGraph: boolean = true
	): Promise<InteractionResult | null> {
		await sleep(400);
		const element = interaction.getElement();
		const type = element.tagName;
		let result: InteractionResult | null = null;
		if (type == HTMLElementType.INPUT) {
			const inputType = element.getAttribute('type');
			if (inputType == HTMLInputType.Submit) {
				result = await this.buttonInteractor.execute(
					<ElementInteraction<HTMLButtonElement>>interaction,
					redirectionCallback
				);
			} else {
				result = await this.inputInteractor.execute(
					<ElementInteraction<HTMLInputElement>>interaction,
					redirectionCallback
				);
			}
		} else if (type == HTMLElementType.BUTTON) {
			result = await this.buttonInteractor.execute(
				<ElementInteraction<HTMLButtonElement>>interaction,
				redirectionCallback
			);
		}

		if (saveInteractionInGraph) {
			await this.elementInteractionGraph.addElementInteractionToGraph(interaction);
		}

		return result;
	}
}

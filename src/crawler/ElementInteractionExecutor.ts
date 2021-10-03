import { HTMLElementType } from '../enums/HTMLElementType';
import { HTMLInputType } from '../enums/HTMLInputType';
import { sleep } from '../util';
import { ButtonInteractor } from './ButtonInteractor';
import { ElementInteraction } from './ElementInteraction';
import { InputInteractor } from './InputInteractor';
import { InteractionResult } from './InteractionResult';
import { ElementInteractionGraph } from './ElementInteractionGraph';
import { TableRowInteractor } from './TableRowInteractor';
import { TableColumnInteractor } from './TableColumnInteractor';

// TODO: Refatorar essa classe
export class ElementInteractionExecutor {
	constructor(
		private inputInteractor: InputInteractor,
		private buttonInteractor: ButtonInteractor,
		private tableRowInteractor: TableRowInteractor,
		private tableColumnInteractor: TableColumnInteractor,
		private elementInteractionGraph: ElementInteractionGraph
	) {}

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
		} else if (type == HTMLElementType.TR) {
			result = await this.tableRowInteractor.execute(
				<ElementInteraction<HTMLTableRowElement>>interaction
			);
		} else if (type == HTMLElementType.TH) {
			result = await this.tableColumnInteractor.execute(
				<ElementInteraction<HTMLTableColElement>>interaction
			);
		}

		if (saveInteractionInGraph) {
			await this.elementInteractionGraph.addElementInteractionToGraph(interaction);
		}

		return result;
	}
}

import { HTMLElementType } from '../enums/HTMLElementType';
import { HTMLInputType } from '../enums/HTMLInputType';
import { getPathTo, sleep } from '../util';
import { ElementInteraction } from './ElementInteraction';
import { InteractionResult } from './InteractionResult';
import { ElementInteractionGraph } from './ElementInteractionGraph';
import { Interactor } from './Interactor';
import { timeBetweenInteractions } from '../config';

export class ElementInteractionExecutor {
	constructor(
		private interactor: Interactor,
		private elementInteractionGraph: ElementInteractionGraph
	) {}

	public async execute(
		interaction: ElementInteraction<HTMLElement>,
		redirectionCallback?: (interaction: ElementInteraction<HTMLElement>) => Promise<void>,
		saveInteractionInGraph: boolean = true
	): Promise<InteractionResult | null> {
		await sleep(timeBetweenInteractions);

		const element = interaction.getElement();
		const type = element.tagName;

		let result: InteractionResult | null = null;

		if (type == HTMLElementType.INPUT) {
			const inputType = element.getAttribute('type');
			if (
				inputType == HTMLInputType.Submit ||
				inputType == HTMLInputType.Button ||
				inputType == HTMLInputType.Reset
			) {
				result = await this.interactor.executeButton(
					<ElementInteraction<HTMLButtonElement>>interaction,
					redirectionCallback
				);
			} else {
				result = await this.interactor.executeInput(
					<ElementInteraction<HTMLInputElement>>interaction
				);
			}
		} else if (type == HTMLElementType.BUTTON) {
			result = await this.interactor.executeButton(
				<ElementInteraction<HTMLButtonElement>>interaction,
				redirectionCallback
			);
		} else if (type == HTMLElementType.TR) {
			result = await this.interactor.executeTableRow(
				<ElementInteraction<HTMLTableRowElement>>interaction
			);
		} else if (type == HTMLElementType.TH) {
			result = await this.interactor.executeTableColumn(
				<ElementInteraction<HTMLTableColElement>>interaction
			);
		} else if (type == HTMLElementType.TEXTAREA) {
			result = await this.interactor.executeTextarea(
				<ElementInteraction<HTMLTextAreaElement>>interaction
			);
		} else if (type == HTMLElementType.SELECT) {
			result = await this.interactor.executeSelect(
				<ElementInteraction<HTMLSelectElement>>interaction
			);
		}

		console.log("Vai salvar a interação "+ getPathTo(element) +" no main");

		if (saveInteractionInGraph) {
			await this.elementInteractionGraph.addElementInteractionToGraph(interaction);
		}

		console.log("Salvou a interação "+ getPathTo(element) +" no main");

		return result;
	}
}

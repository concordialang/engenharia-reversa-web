import { HTMLElementType } from '../enums/HTMLElementType';
import { HTMLInputType } from '../enums/HTMLInputType';
import { sleep } from '../util';
import { ElementInteraction } from './ElementInteraction';
import { InteractionResult } from './InteractionResult';
import { ElementInteractionGraph } from './ElementInteractionGraph';
import { Interactor } from './Interactor';
import { HTMLEventType } from '../enums/HTMLEventType';
import { ForcingExecutionStoppageErrorFromInteraction } from './ForcingExecutionStoppageErrorFromInteraction';
import { Config } from '../../shared/config';

export class ElementInteractionExecutor {
	constructor(
		private interactor: Interactor,
		private elementInteractionGraph: ElementInteractionGraph,
		private config: Config
	) {}

	public async execute(
		interaction: ElementInteraction<HTMLElement>,
		redirectionCallback?: (interaction: ElementInteraction<HTMLElement>) => Promise<void>,
		saveInteractionInGraph: boolean = true
	): Promise<InteractionResult | null> {
		let timePassed = 0;
		let timeLimit = 300;
		let triggeredUnload = false;
		let alreadyExitedFunction = false;
		window.addEventListener(HTMLEventType.BeforeUnload, async (event) => {
			if (!triggeredUnload && !alreadyExitedFunction) {
				triggeredUnload = true;
				if (redirectionCallback) await redirectionCallback(interaction);
			}
		});
		window.addEventListener(HTMLEventType.Submit, async (event) => {
			timePassed = 0;
			timeLimit = 20000;
		});

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
				result = await this.interactor.executeClicable(
					<ElementInteraction<HTMLButtonElement>>interaction,
					redirectionCallback
				);
			} else {
				result = await this.interactor.executeInput(
					<ElementInteraction<HTMLInputElement>>interaction
				);
			}
		} else if (type == HTMLElementType.BUTTON || type == HTMLElementType.A) {
			result = await this.interactor.executeClicable(
				<ElementInteraction<HTMLButtonElement | HTMLAnchorElement>>interaction,
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

		const timeBetweenChecks = 5;
		while (timePassed < timeLimit) {
			if (triggeredUnload) {
				throw new ForcingExecutionStoppageErrorFromInteraction("Redirected on click");
			}
			timePassed += timeBetweenChecks;
			await sleep(timeBetweenChecks);
		}
		alreadyExitedFunction = true;

		if (saveInteractionInGraph) {
			await this.elementInteractionGraph.addElementInteractionToGraph(interaction);
		}

		await sleep(this.config.timeBetweenInteractions);

		return result;
	}
}

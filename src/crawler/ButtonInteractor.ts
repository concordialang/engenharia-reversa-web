import { HTMLEventType } from '../enums/HTMLEventType';
import { sleep } from '../util';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractor } from './ElementInteractor';
import { InteractionResult } from './InteractionResult';

export class ButtonInteractor implements ElementInteractor<HTMLButtonElement | HTMLInputElement> {
	private window: Window;

	constructor(window: Window) {
		this.window = window;
	}

	public async execute(
		interaction: ElementInteraction<HTMLButtonElement | HTMLInputElement>,
		redirectionCallback?: (interaction: ElementInteraction<HTMLElement>) => Promise<void>
	): Promise<InteractionResult> {
		const element = interaction.getElement();
		let triggeredUnload = false;
		this.window.addEventListener(HTMLEventType.BeforeUnload, async (event) => {
			triggeredUnload = true;
			if (redirectionCallback) await redirectionCallback(interaction);
		});
		element.click();

		let timePassed = 0;
		const timeLimit = 300;
		const timeBetweenChecks = 5;
		while (timePassed < timeLimit) {
			if (triggeredUnload) {
				return new InteractionResult(true);
			}
			timePassed += timeBetweenChecks;
			await sleep(timeBetweenChecks);
		}
		return new InteractionResult(false);
	}
}

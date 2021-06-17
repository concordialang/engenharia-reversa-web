import { HTMLEventType } from '../html/HTMLEventType';
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
		interaction: ElementInteraction<HTMLButtonElement | HTMLInputElement>
	): Promise<InteractionResult> {
		const element = interaction.getElement();
		let triggeredUnload = false;
		this.window.addEventListener('beforeunload', (event) => {
			triggeredUnload = true;
		});
		element.click();

		const evt = document.createEvent('HTMLEvents');
		evt.initEvent(HTMLEventType.Click, false, true);
		element.dispatchEvent(evt);

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

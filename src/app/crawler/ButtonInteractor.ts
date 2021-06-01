import { HTMLEventType } from '../html/HTMLEventType';
import { Util } from '../Util';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractor } from './ElementInteractor';
import { InteractionResult } from './InteractionResult';

export class ButtonInteractor implements ElementInteractor<HTMLButtonElement | HTMLInputElement> {
	private document: HTMLDocument;

	constructor(document: HTMLDocument) {
		this.document = document;
	}

	public execute(interaction: ElementInteraction<HTMLButtonElement | HTMLInputElement>): Promise<InteractionResult> {
		return new Promise((resolve) => {
			const element = interaction.getElement();
			let triggeredUnload = false;
			document.addEventListener(HTMLEventType.Unload, () => {
				triggeredUnload = true;
			});
			element.click();
			this.dispatchEvent(element, HTMLEventType.Click);

			let timePassed = 0;
			const timeLimit = 300;
			const timeBetweenChecks = 5;
			while (timePassed < timeLimit) {
				if (triggeredUnload) resolve(new InteractionResult(true));
				timePassed += timeBetweenChecks;
				Util.sleep(timeBetweenChecks);
			}
			resolve(new InteractionResult(false));
		});
	}

	//UTIL

	private dispatchEvent(element: HTMLElement, eventType: HTMLEventType): void {
		var evt = document.createEvent('HTMLEvents');
		evt.initEvent(eventType, false, true);
		element.dispatchEvent(evt);
	}
}

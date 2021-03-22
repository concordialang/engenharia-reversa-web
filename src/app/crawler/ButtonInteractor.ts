import { HTMLEventType } from '../html/HTMLEventType';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractor } from './ElementInteractor';

export class ButtonInteractor implements ElementInteractor<HTMLButtonElement> {
	public execute(interaction: ElementInteraction<HTMLButtonElement>): void {
		const element = interaction.getElement();
		element.click();
		this.dispatchEvent(element, HTMLEventType.Click);
	}

	//UTIL

	private dispatchEvent(
		element: HTMLElement,
		eventType: HTMLEventType
	): void {
		var evt = document.createEvent('HTMLEvents');
		evt.initEvent(eventType, false, true);
		element.dispatchEvent(evt);
	}

}

import { HTMLElementType } from '../html/HTMLElementType';
import { HTMLEventType } from '../html/HTMLEventType';
import { HTMLInputType } from '../html/HTMLInputType';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractor } from './ElementInteractor';
import { InteractionResult } from './InteractionResult';

export class InputInteractor implements ElementInteractor<HTMLInputElement> {
	public async execute(
		interaction: ElementInteraction<HTMLInputElement>,
		redirectionCallback?: (interaction: ElementInteraction<HTMLElement>) => Promise<void>
	): Promise<InteractionResult> {
		const input = interaction.getElement();
		const type = input.getAttribute('type');

		if (type == HTMLInputType.Text) {
			this.fillTextInput(interaction);
		} else if (type == HTMLInputType.Radio) {
			this.fillRadioInput(interaction);
		} else if (type == HTMLInputType.Checkbox) {
			this.fillCheckboxInput(interaction);
		}

		//refatorar para verificar se causou redirecionamento
		return new InteractionResult(false);
	}

	//RADIO

	private fillRadioInput(interaction: ElementInteraction<HTMLInputElement>): void {
		const element = interaction.getElement();
		const name = element.getAttribute('name');
		const value = interaction.getValue();
		if (name && element.form && value) {
			const radioGroup = this.getFormInputElementsByNameAttributeAndValue(
				element.form,
				name,
				String(value)
			);
			if (radioGroup && radioGroup.length) {
				const chosenRadio = radioGroup[0];
				if (chosenRadio) {
					chosenRadio.checked = true;
				}
				this.dispatchEvent(element, HTMLEventType.Change);
			}
		}
	}

	//TEXT

	private fillTextInput(interaction: ElementInteraction<HTMLInputElement>): void {
		const value = interaction.getValue();
		if (value) {
			const element = interaction.getElement();
			this.simulateTextTyping(element, String(value));
			this.dispatchEvent(element, HTMLEventType.Change);
		}
	}

	private simulateTextTyping(element: HTMLInputElement, text: string): void {
		element.value = text;
	}

	//CHECKBOX

	private fillCheckboxInput(interaction: ElementInteraction<HTMLInputElement>): void {
		const value = interaction.getValue();
		if (value) {
			const element = interaction.getElement();
			element.checked = value == true ? true : false;
			this.dispatchEvent(element, HTMLEventType.Change);
		}
	}

	//UTIL

	private dispatchEvent(element: HTMLElement, eventType: HTMLEventType): void {
		var evt = document.createEvent('HTMLEvents');
		evt.initEvent(eventType, false, true);
		element.dispatchEvent(evt);
	}

	private getFormInputElementsByNameAttributeAndValue(
		form: HTMLFormElement,
		name: string,
		value: string
	): HTMLInputElement[] {
		const matchedInputs: HTMLInputElement[] = [];
		const inputs = form.getElementsByTagName(HTMLElementType.Input);
		for (const input of inputs) {
			const inputNameAttr = input.getAttribute('name');
			const inputValue = input.getAttribute('value');
			if (inputNameAttr && inputNameAttr == name && inputValue && inputValue == value) {
				matchedInputs.push(input as HTMLInputElement);
			}
		}
		return matchedInputs;
	}
}

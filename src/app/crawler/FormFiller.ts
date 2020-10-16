import { HTMLElementType } from '../html/HTMLElementType';
import { HTMLEventType } from '../html/HTMLEventType';
import { HTMLInputType } from '../html/HTMLInputType';

//!!! Refatorar para utilizar algum tipo de padrão de projeto comportamental
//!!! Detalhar mais o disparamento de eventos, atualmente só está lançando "change"
export class FormFiller {
	private radioGroupsAlreadyFilled: string[];

	constructor() {
		this.radioGroupsAlreadyFilled = [];
	}

	public fill(form: HTMLFormElement) {
		const inputs = form.getElementsByTagName(HTMLElementType.Input);
		for (const input of inputs) {
			if (input instanceof HTMLInputElement) this.fillInput(input, form);
		}
		this.radioGroupsAlreadyFilled = [];
	}

	private fillInput(input: HTMLInputElement, form: HTMLFormElement) {
		const type = input.getAttribute('type');
		if (type == HTMLInputType.Text) {
			this.fillTextInput(input);
		} else if (type == HTMLInputType.Radio) {
			this.fillRadioInput(input, form);
		} else if (type == HTMLInputType.Checkbox) {
			this.fillCheckboxInput(input);
		}
	}

	//RADIO

	private fillRadioInput(
		element: HTMLInputElement,
		form: HTMLFormElement
	): void {
		const name = element.getAttribute('name');
		if (name) {
			if (!this.radioGroupsAlreadyFilled.includes(name)) {
				const radioGroup = this.getFormInputElementsByNameAttribute(
					form,
					name
				);
				if (radioGroup && radioGroup.length) {
					const chosenRadio = this.chooseRadioButton(radioGroup);
					if (chosenRadio) {
						chosenRadio.checked = true;
					}
					this.dispatchEvent(element, HTMLEventType.Change);
					this.radioGroupsAlreadyFilled.push(name);
				}
			}
		}
	}

	private chooseRadioButton(
		radioGroup: HTMLInputElement[]
	): HTMLInputElement | null {
		if (radioGroup.length) {
			return radioGroup[0];
		}
		return null;
	}

	//TEXT

	private fillTextInput(element: HTMLInputElement): void {
		this.simulateTextTyping(element, 'test');
		this.dispatchEvent(element, HTMLEventType.Change);
	}

	private simulateTextTyping(element: HTMLInputElement, text: string): void {
		element.value = text;
	}

	//CHECKBOX

	private fillCheckboxInput(element: HTMLInputElement): void {
		element.checked = true;
		this.dispatchEvent(element, HTMLEventType.Change);
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

	private getFormInputElementsByNameAttribute(
		form: HTMLFormElement,
		name: string
	): HTMLInputElement[] {
		const matchedInputs: HTMLInputElement[] = [];
		const inputs = form.getElementsByTagName(HTMLElementType.Input);
		for (const input of inputs) {
			const inputNameAttr = input.getAttribute('name');
			if (inputNameAttr && inputNameAttr == name) {
				matchedInputs.push(input as HTMLInputElement);
			}
		}
		return matchedInputs;
	}

	// private getRandomInt(min : number, max : number) {
	//     min = Math.ceil(min);
	//     max = Math.floor(max);
	//     return Math.floor(Math.random() * (max - min + 1)) + min;
	// }
}

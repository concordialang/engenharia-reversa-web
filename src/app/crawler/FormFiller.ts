import { HTMLElementType } from '../html/HTMLElementType';
import { HTMLEventType } from '../html/HTMLEventType';
import { HTMLInputType } from '../html/HTMLInputType';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractionManager } from './ElementInteractionManager';
import { InputInteractor } from './InputInteractor';

//!!! Refatorar para utilizar algum tipo de padrão de projeto comportamental
//!!! Detalhar mais o disparamento de eventos, atualmente só está lançando "change"
export class FormFiller {
	private radioGroupsAlreadyFilled: string[];
	private elementInteractionManager: ElementInteractionManager;
	private pageUrl: URL;

	constructor(
		elementInteractionManager: ElementInteractionManager,
		pageUrl: URL
	) {
		this.radioGroupsAlreadyFilled = [];
		this.elementInteractionManager = elementInteractionManager;
		this.pageUrl = pageUrl;
	}

	public fill(form: HTMLFormElement) {
		const inputs = form.getElementsByTagName(HTMLElementType.Input);
		for (const input of inputs) {
			if (input instanceof HTMLInputElement) {
				this.fillInput(input);
			}
		}
		this.radioGroupsAlreadyFilled = [];
	}

	private fillInput(input: HTMLInputElement) {
		const type = input.getAttribute('type');
		if (type == HTMLInputType.Text) {
			this.fillTextInput(input);
		} else if (type == HTMLInputType.Radio) {
			this.fillRadioInput(input);
		} else if (type == HTMLInputType.Checkbox) {
			this.fillCheckboxInput(input);
		}
	}

	//RADIO

	private fillRadioInput(element: HTMLInputElement): void {
		const name = element.getAttribute('name');
		const form = element.form;
		if (name && form) {
			if (!this.radioGroupsAlreadyFilled.includes(name)) {
				const radioGroup = this.getFormInputElementsByNameAttribute(
					form,
					name
				);
				if (radioGroup && radioGroup.length) {
					const chosenRadio = this.chooseRadioButton(radioGroup);
					if (chosenRadio) {
						const interaction = new ElementInteraction<
							HTMLInputElement
						>(
							chosenRadio,
							HTMLEventType.Change,
							this.pageUrl,
							chosenRadio.value
						);
						this.elementInteractionManager.execute(
							interaction,
							true
						);
						this.radioGroupsAlreadyFilled.push(name);
					}
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
		const interaction = new ElementInteraction<HTMLInputElement>(
			element,
			HTMLEventType.Change,
			this.pageUrl,
			'teste'
		);
		this.elementInteractionManager.execute(interaction, true);
	}

	//CHECKBOX

	private fillCheckboxInput(element: HTMLInputElement): void {
		const interaction = new ElementInteraction<HTMLInputElement>(
			element,
			HTMLEventType.Change,
			this.pageUrl,
			true
		);
		this.elementInteractionManager.execute(interaction, true);
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

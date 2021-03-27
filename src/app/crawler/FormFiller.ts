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

	public async fill(form: HTMLFormElement) {
		const elements = form.elements;
		for (const element of elements) {
			if (element instanceof HTMLInputElement) {
				await this.fillInput(element);
			} else if (element instanceof HTMLButtonElement) {
				const interaction = new ElementInteraction(
					element,
					HTMLEventType.Click,
					this.pageUrl
				);
				//this.elementInteractionManager.execute(interaction);
			}
			console.log(this.elementInteractionManager.getLastInteraction());
		}
		this.radioGroupsAlreadyFilled = [];
	}

	private async fillInput(input: HTMLInputElement) {
		const type = input.getAttribute('type');
		if (type == HTMLInputType.Text) {
			await this.fillTextInput(input);
		} else if (type == HTMLInputType.Radio) {
			await this.fillRadioInput(input);
		} else if (type == HTMLInputType.Checkbox) {
			await this.fillCheckboxInput(input);
		}
	}

	//RADIO

	private async fillRadioInput(element: HTMLInputElement): Promise<void> {
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
						await this.elementInteractionManager.execute(
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

	private async fillTextInput(element: HTMLInputElement): Promise<void> {
		const interaction = new ElementInteraction<HTMLInputElement>(
			element,
			HTMLEventType.Change,
			this.pageUrl,
			'teste'
		);
		await this.elementInteractionManager.execute(interaction, true);
	}

	//CHECKBOX

	private async fillCheckboxInput(element: HTMLInputElement): Promise<void> {
		const interaction = new ElementInteraction<HTMLInputElement>(
			element,
			HTMLEventType.Change,
			this.pageUrl,
			true
		);
		await this.elementInteractionManager.execute(interaction, true);
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

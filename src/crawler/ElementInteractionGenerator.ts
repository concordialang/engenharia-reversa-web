import { HTMLElementType } from '../enums/HTMLElementType';
import { HTMLEventType } from '../enums/HTMLEventType';
import { HTMLInputType } from '../enums/HTMLInputType';
import { Variant } from '../spec-analyser/Variant';
import { BrowserContext } from './BrowserContext';
import { ElementInteraction } from './ElementInteraction';

export class ElementInteractionGenerator {
	private radioGroupsAlreadyFilled: string[];

	constructor(private browserContext: BrowserContext) {
		this.radioGroupsAlreadyFilled = [];
	}

	public generate(
		element: HTMLElement,
		variant: Variant
	): ElementInteraction<HTMLElement> | null {
		let interaction: ElementInteraction<HTMLElement> | null = null;
		if (element instanceof HTMLInputElement) {
			interaction = this.generateInputInteraction(element);
		} else if (element instanceof HTMLTableRowElement) {
			interaction = this.generateTableRowInteraction(element);
		} else if (element instanceof HTMLTableCellElement) {
			interaction = this.generateTableCellInteraction(element);
		} else if (element instanceof HTMLButtonElement) {
			interaction = new ElementInteraction(
				element,
				HTMLEventType.Click,
				this.browserContext.getUrl()
			);
		}

		interaction?.setVariant(variant);

		return interaction;
	}

	public resetFilledRadioGroups() {
		this.radioGroupsAlreadyFilled = [];
	}

	private generateInputInteraction(
		input: HTMLInputElement
	): ElementInteraction<HTMLInputElement> | null {
		const type = input.getAttribute('type');
		if (type == HTMLInputType.Text) {
			return this.generateTextInputInteraction(input);
		} else if (type == HTMLInputType.Email) {
			return this.generateTextInputInteraction(input);
		} else if (type == HTMLInputType.Radio) {
			return this.generateRadioInputInteraction(input);
		} else if (type == HTMLInputType.Checkbox) {
			return this.generateCheckboxInputInteraction(input);
		} else if (type == HTMLInputType.Submit) {
			return new ElementInteraction(input, HTMLEventType.Click, this.browserContext.getUrl());
		}
		return null;
	}

	// TABLE ROW

	private generateTableRowInteraction(
		row: HTMLTableRowElement
	): ElementInteraction<HTMLTableRowElement> | null {
		return new ElementInteraction(row, HTMLEventType.Click, this.browserContext.getUrl());
	}

	// TABLE COLUMN

	private generateTableCellInteraction(
		column: HTMLTableCellElement
	): ElementInteraction<HTMLTableCellElement> | null {
		return new ElementInteraction(column, HTMLEventType.Click, this.browserContext.getUrl());
	}

	//RADIO

	private generateRadioInputInteraction(
		element: HTMLInputElement
	): ElementInteraction<HTMLInputElement> | null {
		const name = element.getAttribute('name');
		const form = element.form;
		if (name && form) {
			if (!this.radioGroupsAlreadyFilled.includes(name)) {
				const radioGroup = this.getFormInputElementsByNameAttribute(form, name);
				if (radioGroup && radioGroup.length) {
					const chosenRadio = this.chooseRadioButton(radioGroup);
					if (chosenRadio) {
						const interaction = new ElementInteraction<HTMLInputElement>(
							chosenRadio,
							HTMLEventType.Change,
							this.browserContext.getUrl(),
							chosenRadio.value
						);
						this.radioGroupsAlreadyFilled.push(name);
						return interaction;
					}
				}
			}
		}
		return null;
	}

	private chooseRadioButton(radioGroup: HTMLInputElement[]): HTMLInputElement | null {
		if (radioGroup.length) {
			return radioGroup[0];
		}
		return null;
	}

	//TEXT

	private generateTextInputInteraction(
		element: HTMLInputElement
	): ElementInteraction<HTMLInputElement> {
		const interaction = new ElementInteraction<HTMLInputElement>(
			element,
			HTMLEventType.Change,
			this.browserContext.getUrl(),
			'teste'
		);
		return interaction;
	}

	//CHECKBOX

	private generateCheckboxInputInteraction(
		element: HTMLInputElement
	): ElementInteraction<HTMLInputElement> {
		const interaction = new ElementInteraction<HTMLInputElement>(
			element,
			HTMLEventType.Change,
			this.browserContext.getUrl(),
			true
		);
		return interaction;
	}

	private getFormInputElementsByNameAttribute(
		form: HTMLFormElement,
		name: string
	): HTMLInputElement[] {
		const matchedInputs: HTMLInputElement[] = [];
		const inputs = form.getElementsByTagName(HTMLElementType.INPUT);
		for (const input of inputs) {
			const inputNameAttr = input.getAttribute('name');
			if (inputNameAttr && inputNameAttr == name) {
				matchedInputs.push(input as HTMLInputElement);
			}
		}
		return matchedInputs;
	}
}

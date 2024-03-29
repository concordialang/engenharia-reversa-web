import { HTMLElementType } from '../enums/HTMLElementType';
import { HTMLEventType } from '../enums/HTMLEventType';
import { HTMLInputType } from '../enums/HTMLInputType';
import { ElementInteraction } from './ElementInteraction';
import { InteractionResult } from './InteractionResult';

export class Interactor {
	constructor(private window: Window) {}

	public async executeInput(
		interaction: ElementInteraction<HTMLInputElement>
	): Promise<InteractionResult> {
		const input = interaction.getElement();
		const type = input.getAttribute('type');

		if (type == HTMLInputType.Radio) {
			this.fillRadioInput(interaction);
		} else if (type == HTMLInputType.Checkbox) {
			this.fillCheckboxInput(interaction);
		} else {
			this.fillStringInput(interaction);
		}

		return new InteractionResult(false);
	}

	// DEFAULT

	private fillStringInput(interaction: ElementInteraction<HTMLInputElement>): void {
		const value = interaction.getValue();
		if (value) {
			const element = interaction.getElement();
			this.simulateTextTyping(element, String(value));
			this.dispatchEvent(element, HTMLEventType.Change);
		}
	}

	// RADIO

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
				this.dispatchEvent(element, HTMLEventType.Click);
			}
		}
	}

	// CHECKBOX

	private fillCheckboxInput(interaction: ElementInteraction<HTMLInputElement>): void {
		const value = interaction.getValue();
		if (value) {
			const element = interaction.getElement();
			element.checked = value ? true : false;
			this.dispatchEvent(element, HTMLEventType.Click);
		}
	}

	private getFormInputElementsByNameAttributeAndValue(
		form: HTMLFormElement,
		name: string,
		value: string
	): HTMLInputElement[] {
		const matchedInputs: HTMLInputElement[] = [];
		const inputs = form.getElementsByTagName(HTMLElementType.INPUT);
		for (const input of inputs) {
			const inputNameAttr = input.getAttribute('name');
			const inputValue = input.getAttribute('value');
			if (inputNameAttr && inputNameAttr == name && inputValue && inputValue == value) {
				matchedInputs.push(input as HTMLInputElement);
			}
		}
		return matchedInputs;
	}

	// CLICABLE (BUTTONS AND ANCHORS)

	public async executeClicable(
		interaction: ElementInteraction<HTMLButtonElement | HTMLInputElement | HTMLAnchorElement>,
		redirectionCallback?: (interaction: ElementInteraction<HTMLElement>) => Promise<void>
	): Promise<InteractionResult> {
		const element = interaction.getElement();
		element.click();
		return new InteractionResult(false);
	}

	// TABLE ROW (TR)

	public async executeTableRow(
		interaction: ElementInteraction<HTMLTableRowElement>
	): Promise<InteractionResult> {
		const element = interaction.getElement();

		element.click();

		return new InteractionResult(false);
	}

	// TABLE COLUMN (TH)

	public async executeTableColumn(
		interaction: ElementInteraction<HTMLTableColElement>
	): Promise<InteractionResult> {
		const element = interaction.getElement();

		element.click();

		return new InteractionResult(false);
	}

	// TEXT AREA

	public async executeTextarea(
		interaction: ElementInteraction<HTMLTextAreaElement>
	): Promise<InteractionResult> {
		const value = interaction.getValue();
		if (value) {
			const element = interaction.getElement();
			this.simulateTextTyping(element, String(value));
			this.dispatchEvent(element, HTMLEventType.Change);
		}

		return new InteractionResult(false);
	}

	// SELECT

	public async executeSelect(
		interaction: ElementInteraction<HTMLSelectElement>
	): Promise<InteractionResult> {
		const value = interaction.getValue();
		if (value) {
			const element = interaction.getElement();
			element.value = String(value);
			this.dispatchEvent(element, HTMLEventType.Change);
		}

		return new InteractionResult(false);
	}

	// UTIL

	private simulateTextTyping(
		element: HTMLInputElement | HTMLTextAreaElement,
		text: string
	): void {
		element.value = text;
	}

	private dispatchEvent(element: HTMLElement, eventType: HTMLEventType): void {
		let evt = new Event(eventType, { bubbles: false, cancelable: true });
		element.dispatchEvent(evt);
	}
}

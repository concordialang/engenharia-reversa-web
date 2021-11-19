import { HTMLEventType } from '../enums/HTMLEventType';
import { HTMLInputType } from '../enums/HTMLInputType';
import { BrowserContext } from './BrowserContext';
import { ElementInteraction } from './ElementInteraction';

export class ElementInteractionGenerator {
	constructor(private browserContext: BrowserContext) {}

	public generate(element: HTMLElement): ElementInteraction<HTMLElement> | null {
		let interaction: ElementInteraction<HTMLElement> | null = null;

		if (element instanceof HTMLInputElement) {
			interaction = this.generateInputInteraction(element);
		} else if (element instanceof HTMLTextAreaElement) {
			interaction = this.generateTextAreaInteraction(element);
		} else if (element instanceof HTMLSelectElement) {
			interaction = this.generateSelectInteraction(element);
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

		return interaction;
	}

	// INPUT
	private generateInputInteraction(
		input: HTMLInputElement
	): ElementInteraction<HTMLInputElement> | null {
		let type = input.getAttribute('type');

		if (!type) {
			type = HTMLInputType.Text;
		}

		let interaction: ElementInteraction<HTMLInputElement> | null = new ElementInteraction<
			HTMLInputElement
		>(input, HTMLEventType.Change, this.browserContext.getUrl());

		if (type == HTMLInputType.Radio && input.value) {
			interaction.setValue(input.value);
		} else if (type == HTMLInputType.Checkbox) {
			interaction.setValue(true);
		} else if (type == HTMLInputType.Submit || type == HTMLInputType.Button) {
			interaction = new ElementInteraction(
				input,
				HTMLEventType.Click,
				this.browserContext.getUrl()
			);
		} else {
			interaction.setValue(this.generateDataInteraction(input));
		}

		return interaction;
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

	// TEXT AREA

	private generateTextAreaInteraction(
		element: HTMLTextAreaElement
	): ElementInteraction<HTMLTextAreaElement> {
		const interaction = new ElementInteraction<HTMLTextAreaElement>(
			element,
			HTMLEventType.Change,
			this.browserContext.getUrl(),
			this.generateDataInteraction(element)
		);
		return interaction;
	}

	// SELECT

	private generateSelectInteraction(
		element: HTMLSelectElement
	): ElementInteraction<HTMLSelectElement> | null {
		if (element.options.length <= 0) {
			return null;
		}

		const interaction = new ElementInteraction<HTMLSelectElement>(
			element,
			HTMLEventType.Change,
			this.browserContext.getUrl(),
			Array.from(element.options).reverse()[0].value // last option value
		);

		return interaction;
	}

	// avaliar email, data, time, date-time, number
	private generateDataInteraction(elm: HTMLInputElement | HTMLTextAreaElement): string {
		if (elm.value) {
			return elm.value;
		}

		if (elm instanceof HTMLTextAreaElement) {
			return this.generateStringToInpuTextAndTextArea(elm);
		}

		switch (elm.type) {
			case HTMLInputType.Text:
				return this.generateStringToInpuTextAndTextArea(elm);
			case HTMLInputType.Number:
				return this.generateStringToInputNumber(elm);
			case HTMLInputType.Email:
				return this.generateStringToInputEmail(elm);
			case HTMLInputType.Date:
				return this.generateStringToInputDate(elm);
			case HTMLInputType.Date:
				return this.generateStringToInputTime(elm);
			case HTMLInputType.Date:
				return this.generateStringToInputDateTime(elm);
			default:
				return this.generateStringToInpuTextAndTextArea(elm);
		}
	}

	private generateStringToInpuTextAndTextArea(
		elm: HTMLInputElement | HTMLTextAreaElement
	): string {
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		const charactersLength = characters.length;
		let stringLength = 15; // default value

		if (elm.minLength && elm.minLength !== -1 && elm.minLength > stringLength) {
			stringLength = elm.minLength;
		}

		if (elm.maxLength && elm.maxLength !== -1 && elm.maxLength < stringLength) {
			stringLength = elm.maxLength;
		}

		let strText = '';

		for (let i = 0; i < stringLength; i++) {
			strText += characters.charAt(Math.floor(Math.random() * charactersLength));
		}

		return strText;
	}

	private generateStringToInputNumber(elm: HTMLInputElement): string {
		let minNumber: number = 0; // default value
		let maxNumber: number = 99; // default value

		if (elm.min && parseInt(elm.min) > minNumber) {
			minNumber = parseInt(elm.min);
		}

		if (elm.max && parseInt(elm.max) > maxNumber) {
			maxNumber = parseInt(elm.max);
		}

		if (minNumber >= maxNumber) {
			maxNumber = minNumber * 10;
		}

		return Math.round(Math.random() * (maxNumber - minNumber) + minNumber).toString();
	}

	private generateStringToInputEmail(elm: HTMLInputElement): string {
		let strEmail = '';

		return strEmail;
	}

	private generateStringToInputDate(elm: HTMLInputElement): string {
		let strDateTime = '';

		return strDateTime;
	}

	private generateStringToInputTime(elm: HTMLInputElement): string {
		let strDateTime = '';

		return strDateTime;
	}

	private generateStringToInputDateTime(elm: HTMLInputElement): string {
		let strDateTime = '';

		return strDateTime;
	}
}

import { HTMLEventType } from '../enums/HTMLEventType';
import { HTMLInputType } from '../enums/HTMLInputType';
import { BrowserContext } from './BrowserContext';
import { ElementInteraction } from './ElementInteraction';
import {
	generateRandomStr,
	generateRandomNumber,
	isValidDate,
	generateRamdonStrForRegex,
	isValidTime,
	isValidDateTime,
} from '../util';

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
		} else {
			const isValidType = (Object as any).values(HTMLInputType).includes(type);
			if (!isValidType) {
				return null;
			}
		}

		let interaction: ElementInteraction<HTMLInputElement> | null = new ElementInteraction<
			HTMLInputElement
		>(input, HTMLEventType.Click, this.browserContext.getUrl());

		if (type == HTMLInputType.Radio && input.value) {
			interaction.setValue(input.value);
		} else if (type == HTMLInputType.Checkbox) {
			interaction.setValue(true);
		} else if (
			type == HTMLInputType.Submit ||
			type == HTMLInputType.Button ||
			type == HTMLInputType.Reset
		) {
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

		let index: number = element.options.length - 1;

		if (element.options.length > 2) {
			index = generateRandomNumber(2, index);
		}

		const interaction = new ElementInteraction<HTMLSelectElement>(
			element,
			HTMLEventType.Change,
			this.browserContext.getUrl(),
			element.options[index].value
		);

		return interaction;
	}

	private generateDataInteraction(elm: HTMLInputElement | HTMLTextAreaElement): string {
		if (elm.value) {
			return elm.value;
		}

		if (elm instanceof HTMLTextAreaElement) {
			return this.generateStringToTextArea(elm);
		}

		switch (elm.type) {
			case HTMLInputType.Text:
				return this.generateStringToInpuText(elm);
			case HTMLInputType.Number:
				return this.generateStringToInputNumber(elm);
			case HTMLInputType.Email:
				return this.generateStringToInputEmail(elm);
			case HTMLInputType.Date:
				return this.generateStringToInputDate(elm);
			case HTMLInputType.Time:
				return this.generateStringToInputTime(elm);
			case HTMLInputType.DateTimeLocal:
				return this.generateStringToInputDateTime(elm);
			default:
				return this.generateStringToInpuText(elm);
		}
	}

	private generateStringToTextArea(elm: HTMLTextAreaElement): string {
		let strLength = 15; // default value

		if (elm.minLength && elm.minLength !== -1 && elm.minLength > strLength) {
			strLength = elm.minLength;
		}

		if (elm.maxLength && elm.maxLength !== -1 && elm.maxLength < strLength) {
			strLength = elm.maxLength;
		}

		let strText = generateRandomStr(strLength);

		return strText;
	}

	private generateStringToInpuText(elm: HTMLInputElement): string {
		let strLength = 15; // default value
		let strText = '';

		if (elm.pattern) {
			strText = generateRamdonStrForRegex(elm.pattern);
		} else {
			if (elm.minLength && elm.minLength !== -1 && elm.minLength > strLength) {
				strLength = elm.minLength;
			}

			if (elm.maxLength && elm.maxLength !== -1 && elm.maxLength < strLength) {
				strLength = elm.maxLength;
			}

			strText = generateRandomStr(strLength);
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

		let strNumber = generateRandomNumber(minNumber, maxNumber).toString();

		return strNumber;
	}

	private generateStringToInputEmail(elm: HTMLInputElement): string {
		let strLength = 15; // default value
		let strEmail = '';

		if (elm.pattern) {
			strEmail = generateRamdonStrForRegex(elm.pattern);
		} else {
			if (elm.minLength && elm.minLength !== -1 && elm.minLength > strLength) {
				strLength = elm.minLength;
			}

			if (elm.maxLength && elm.maxLength !== -1 && elm.maxLength < strLength) {
				strLength = elm.maxLength;
			}

			// discounts @ character
			strLength--;

			let strEmail1 = '';
			let strEmail2 = '';

			if (strLength % 2 === 0) {
				let strLengthPart = strLength / 2;
				strEmail1 = generateRandomStr(strLengthPart);
				strEmail2 = generateRandomStr(strLengthPart);
			} else {
				strLength++;
				let strLengthPart = strLength / 2;
				strEmail1 = generateRandomStr(strLengthPart);

				strLengthPart--;
				strEmail2 = generateRandomStr(strLengthPart);
			}

			strEmail = strEmail1 + '@' + strEmail2;
		}

		return strEmail;
	}

	private generateStringToInputDate(elm: HTMLInputElement): string {
		let strDate = '2000-01-01'; // default value

		if (elm.min && isValidDate(elm.min) && elm.min > strDate) {
			strDate = elm.min;
		}

		if (elm.max && isValidDate(elm.max) && elm.max < strDate) {
			strDate = elm.max;
		}

		return strDate;
	}

	private generateStringToInputTime(elm: HTMLInputElement): string {
		let strTime = '00:00:00'; // default value

		if (elm.min && isValidTime(elm.min)) {
			strTime = elm.min;
		} else if (elm.max && isValidTime(elm.max)) {
			strTime = elm.max;
		}

		return strTime;
	}

	private generateStringToInputDateTime(elm: HTMLInputElement): string {
		let strDateTime = '2000-01-01T00:00:00';

		if (elm.min && isValidDateTime(elm.min)) {
			strDateTime = elm.min;
		} else if (elm.max && isValidDateTime(elm.max)) {
			strDateTime = elm.max;
		}

		return strDateTime;
	}
}

import { UIElement } from './UIElement';
import { UIProperty } from './UIProperty';
import { HTMLElementType } from '../enums/HTMLElementType';
import { formatToFirstCapitalLetter, getPathTo } from '../util';
import { ValidUiElementsNodes } from '../enums/ValidUiElementsNodes';
import { PropertyTypes } from '../enums/PropertyTypes';
import { UiElementsTypes } from '../enums/UiElementsTypes';
import { DataTypes } from '../enums/DataTypes';
import { HTMLInputType } from '../enums/HTMLInputType';

const DEFAULT_MAX_LENGTH = 524288;

export class UIElementGenerator {
	public createFromElement(elm: HTMLElement): UIElement | null {
		let uiElement: UIElement | null = null;

		const isValidElement = (Object as any).values(ValidUiElementsNodes).includes(elm.nodeName);
		if (!isValidElement) {
			return null;
		}

		if (
			elm instanceof HTMLButtonElement ||
			(elm instanceof HTMLInputElement &&
				(elm.type === HTMLInputType.Button ||
					elm.type === HTMLInputType.Submit ||
					elm.type === HTMLInputType.Reset))
		) {
			uiElement = this.createFromButton(elm);
		} else if (
			elm instanceof HTMLInputElement ||
			elm instanceof HTMLSelectElement ||
			elm instanceof HTMLTextAreaElement
		) {
			uiElement = this.createFromEditableElements(elm);
		} else {
			uiElement = this.createFromOthers(elm);
		}

		return uiElement;
	}

	private createFromEditableElements(elm): UIElement {
		let uiElm = new UIElement(elm);

		// id
		uiElm.setProperty(this.generatePropertyId(elm));

		// name
		uiElm.setName(this.generateName(elm, uiElm.getId()));

		if (elm instanceof HTMLSelectElement && elm.options.length > 0) {
			let value = Array.from(elm.options).reverse()[0].value; // set last option value
			uiElm.setProperty(new UIProperty(PropertyTypes.VALUE, value));
		}

		// type
		let type = this.generateType(elm);
		if (type) {
			uiElm.setProperty(new UIProperty(PropertyTypes.TYPE, type));
		}

		// editabled
		uiElm.setProperty(new UIProperty(PropertyTypes.EDITABLE, true));

		// dataType
		let dataType = this.gerateDataType(elm);
		if (dataType) {
			uiElm.setProperty(new UIProperty(PropertyTypes.DATATYPE, dataType));
		}

		// required
		if (elm.required) {
			uiElm.setProperty(new UIProperty(PropertyTypes.REQUIRED, elm.required));
		}

		if (elm instanceof HTMLInputElement || elm instanceof HTMLTextAreaElement) {
			// min_length
			if (elm.minLength && elm.minLength !== -1) {
				uiElm.setProperty(new UIProperty(PropertyTypes.MINLENGTH, elm.minLength));
			}

			// max_length
			if (elm.maxLength && elm.maxLength !== DEFAULT_MAX_LENGTH && elm.maxLength !== -1) {
				uiElm.setProperty(new UIProperty(PropertyTypes.MAXLENGTH, elm.maxLength));
			}

			if (elm instanceof HTMLInputElement) {
				// min_value
				if (elm.min) {
					uiElm.setProperty(new UIProperty(PropertyTypes.MINVALUE, elm.min));
				}

				// max_value
				if (elm.max) {
					uiElm.setProperty(new UIProperty(PropertyTypes.MAXVALUE, elm.max));
				}
			}
		}

		return uiElm;
	}

	private createFromButton(elm: HTMLButtonElement | HTMLInputElement): UIElement {
		let uiElm = new UIElement(elm);

		// id
		uiElm.setProperty(this.generatePropertyId(elm));

		// name
		uiElm.setName(this.generateNameForButton(elm, uiElm.getId()));

		// type
		uiElm.setProperty(new UIProperty(PropertyTypes.TYPE, 'button'));

		return uiElm;
	}

	private createFromOthers(elm): UIElement | null {
		if (
			elm.nodeName === ValidUiElementsNodes.LABEL ||
			((elm.nodeName === ValidUiElementsNodes.STRONG ||
				elm.nodeName === ValidUiElementsNodes.B ||
				elm.nodeName === ValidUiElementsNodes.P ||
				elm.nodeName === ValidUiElementsNodes.SPAN) &&
			!elm.innerText)
		) {
			return null;
		}

		let uiElm = new UIElement(elm);

		// id
		uiElm.setProperty(this.generatePropertyId(elm));

		// name
		uiElm.setName(uiElm.getId());

		// value
		if (elm.innerText) {
			let value = elm.innerText;
			uiElm.setProperty(new UIProperty(PropertyTypes.VALUE, value, undefined, true));
		}

		return uiElm;
	}

	private generateName(
		elm: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
		idUiElm: string
	): string {
		let name: string = '';

		if (elm.name && !(elm instanceof HTMLInputElement && elm.type === HTMLInputType.Radio)) {
			name = formatToFirstCapitalLetter(elm.name);
		} else if (
			elm instanceof HTMLInputElement &&
			(elm.type === HTMLInputType.Radio || elm.type === HTMLInputType.Checkbox) &&
			elm.nextElementSibling instanceof HTMLLabelElement
		) {
			name = this.generateNameFromLabel(elm.nextElementSibling, elm, false);
		} else if (elm.previousElementSibling instanceof HTMLLabelElement) {
			name = this.generateNameFromLabel(elm.previousElementSibling, elm);
		} else if (
			elm.previousElementSibling instanceof HTMLBRElement &&
			elm.previousElementSibling.previousElementSibling instanceof HTMLLabelElement
		) {
			name = this.generateNameFromLabel(
				elm.previousElementSibling.previousElementSibling,
				elm
			);
		} else if (
			elm.parentElement instanceof HTMLDivElement &&
			elm.parentElement.previousElementSibling instanceof HTMLLabelElement
		) {
			name = this.generateNameFromLabel(elm.parentElement.previousElementSibling, elm);
		}

		name = name ? name : idUiElm;

		return name.trim();
	}

	private generateNameFromLabel(
		label: HTMLLabelElement,
		elm: HTMLElement,
		assumeInnerText = true
	): string {
		let name: string = '';

		if (label.htmlFor && elm.id && elm.id == label.htmlFor) {
			if (label.innerText) {
				name = formatToFirstCapitalLetter(label.innerText);
			} else {
				name = formatToFirstCapitalLetter(label.htmlFor);
			}
		} else if (!label.htmlFor && label.innerText && assumeInnerText) {
			name = formatToFirstCapitalLetter(label.innerText);
		}

		return name.trim();
	}

	private generateNameForButton(
		elm: HTMLButtonElement | HTMLInputElement,
		idUiElm: string
	): string {
		let name: string = '';

		if (elm.name) {
			name = formatToFirstCapitalLetter(elm.name);
		} else if (elm instanceof HTMLButtonElement && elm.innerText) {
			name = formatToFirstCapitalLetter(elm.innerText);
		}

		name = name ? name : idUiElm;

		return name.trim();
	}

	private generatePropertyId(elm: HTMLElement): UIProperty {
		let id = '';
		let isIdXPath = false;

		if (elm.id) {
			id = elm.id;
		} else {
			id = getPathTo(elm);
			isIdXPath = true;
		}

		return new UIProperty(PropertyTypes.ID, id, isIdXPath);
	}

	private generateType(elm: HTMLElement): string {
		let uiElmType = '';

		switch (elm.nodeName) {
			case HTMLElementType.INPUT:
				let inputType = (elm as HTMLInputElement).type;

				if (inputType == HTMLInputType.Checkbox) {
					uiElmType = UiElementsTypes.Checkbox;
				} else if (inputType == HTMLInputType.Radio) {
					uiElmType = UiElementsTypes.Radio;
				} else if (
					inputType === HTMLInputType.Button ||
					inputType === HTMLInputType.Submit ||
					inputType === HTMLInputType.Reset
				) {
					uiElmType = UiElementsTypes.Button;
				} else {
					uiElmType = UiElementsTypes.TextBox;
				}
				break;

			case HTMLElementType.SELECT:
				uiElmType = UiElementsTypes.Select;
				break;

			case HTMLElementType.TEXTAREA:
				uiElmType = UiElementsTypes.TextArea;
				break;

			case HTMLElementType.BUTTON:
				uiElmType = UiElementsTypes.Button;
				break;
		}

		return uiElmType;
	}

	private gerateDataType(elm: HTMLElement): string {
		let uiElmDataType = '';

		if (elm.nodeName == ValidUiElementsNodes.TEXTAREA) {
			uiElmDataType = DataTypes.STRING;
		}

		if (elm.nodeName == ValidUiElementsNodes.INPUT) {
			let inputType = (elm as HTMLInputElement).type;

			if (inputType == HTMLInputType.Date) {
				uiElmDataType = DataTypes.DATE;
			} else if (inputType == HTMLInputType.Time) {
				uiElmDataType = DataTypes.TIME;
			} else if (inputType == HTMLInputType.DateTimeLocal) {
				uiElmDataType = DataTypes.DATETIME;
			} else {
				uiElmDataType = DataTypes.STRING;
			}
		}

		return uiElmDataType;
	}
}

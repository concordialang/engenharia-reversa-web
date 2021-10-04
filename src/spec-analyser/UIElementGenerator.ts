import { UIElement } from './UIElement';
import { UIProperty } from './UIProperty';
import { HTMLElementType } from '../enums/HTMLElementType';
import { formatToFirstCapitalLetter, getPathTo } from '../util';
import { ValidNodesUiElements } from '../enums/ValidNodesUiElements';
import { PropertyTypes } from '../enums/PropertyTypes';
import { UiElementsTypes } from '../enums/UiElementsTypes';
import { DataTypes } from '../enums/DataTypes';

const DEFAULT_MAX_LENGTH = 524288;

export class UIElementGenerator {
	public createFromElement(elm: HTMLElement): UIElement | null {
		let uiElement: UIElement | null = null;

		const isElementValid = (Object as any).values(ValidNodesUiElements).includes(elm.nodeName);
		if (!isElementValid) {
			return null;
		}

		if (
			elm instanceof HTMLButtonElement ||
			(elm instanceof HTMLInputElement &&
				(elm.type === 'button' || elm.type === 'submit' || elm.type === 'reset'))
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
		uiElm.setProperty(new UIProperty(PropertyTypes.ID, this.generateId(elm)));

		// name
		uiElm.setName(this.generateName(elm, uiElm.getId()));

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

		// value
		// if (elm.value) {
		// 	uiElm.setProperty(new UIProperty(PropertyTypes.VALUE, elm.value));
		// }

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
		uiElm.setProperty(new UIProperty(PropertyTypes.ID, this.generateId(elm)));

		// name
		uiElm.setName(this.generateNameForButton(elm, uiElm.getId()));

		// type
		let type = elm.type ? elm.type : 'button';
		uiElm.setProperty(new UIProperty(PropertyTypes.TYPE, type));

		return uiElm;
	}

	private createFromOthers(elm): UIElement {
		let uiElm = new UIElement(elm);

		// id
		uiElm.setProperty(new UIProperty(PropertyTypes.ID, this.generateId(elm)));

		// name
		uiElm.setName(uiElm.getId());

		return uiElm;
	}

	private generateName(
		elm: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
		idUiElm: string
	): string {
		let name: string = '';

		if (elm.name) {
			name = formatToFirstCapitalLetter(elm.name);
		} else if (elm.previousElementSibling?.nodeName === HTMLElementType.LABEL) {
			name = this.generateNameFromPreviousLabel(elm);
		} else if (
			elm.previousElementSibling?.nodeName === HTMLElementType.BR &&
			elm.previousElementSibling?.previousElementSibling?.nodeName === HTMLElementType.LABEL
		) {
			name = this.generateNameFromPreviousLabel(elm.previousElementSibling as HTMLElement);
		} else if (
			elm.parentElement?.nodeName === HTMLElementType.DIV &&
			elm.parentElement?.previousElementSibling?.nodeName === HTMLElementType.LABEL
		) {
			name = this.generateNameFromPreviousLabel(elm.parentElement);
		}

		name = name ? name : idUiElm;

		return name;
	}

	private generateNameFromPreviousLabel(elm: HTMLElement): string {
		let label: HTMLLabelElement = elm.previousElementSibling as HTMLLabelElement;
		let name: string = '';

		if (!label.innerHTML) {
			name = formatToFirstCapitalLetter(label.innerHTML);
		} else if (label.htmlFor !== undefined) {
			if ((elm.id && elm.id === label.htmlFor) || elm.nodeName === HTMLElementType.BR) {
				name = formatToFirstCapitalLetter(label.htmlFor);
			}
		}

		return name;
	}

	private generateNameForButton(
		elm: HTMLButtonElement | HTMLInputElement,
		idUiElm: string
	): string {
		let name: string = '';

		if (elm.name) {
			name = formatToFirstCapitalLetter(elm.name);
		} else if (elm instanceof HTMLButtonElement && elm.innerHTML) {
			name = formatToFirstCapitalLetter(elm.innerHTML);
		}

		name = name ? name : idUiElm;

		return name;
	}

	public generateId(elm: HTMLElement): string {
		let id = '';

		if (elm.id) {
			id = elm.id;
		} else {
			id = getPathTo(elm);
		}

		return id;
	}

	private generateType(elm: HTMLElement): string {
		let uiElmType = '';

		switch (elm.nodeName) {
			case HTMLElementType.INPUT:
				let inputType = (elm as HTMLInputElement).type;

				if (inputType == 'checkbox') {
					uiElmType = UiElementsTypes.CHECKBOX;
				} else if (inputType == 'radio') {
					uiElmType = UiElementsTypes.RADIO;
				} else if (
					inputType === 'button' ||
					inputType === 'submit' ||
					inputType === 'reset'
				) {
					uiElmType = UiElementsTypes.BUTTON;
				} else {
					uiElmType = UiElementsTypes.TEXTBOX;
				}
				break;

			case HTMLElementType.SELECT:
				uiElmType = UiElementsTypes.SELECT;
				break;

			case HTMLElementType.TEXTAREA:
				uiElmType = UiElementsTypes.TEXTAREA;
				break;

			case HTMLElementType.BUTTON:
				uiElmType = UiElementsTypes.BUTTON;
				break;
		}

		return uiElmType;
	}

	private gerateDataType(elm: HTMLElement): string {
		let uiElmDataType = '';

		if (elm.nodeName == ValidNodesUiElements.TEXTAREA) {
			uiElmDataType = DataTypes.STRING;
		}

		if (elm.nodeName == ValidNodesUiElements.INPUT) {
			let inputType = (elm as HTMLInputElement).type;

			if (inputType == 'date') {
				uiElmDataType = DataTypes.DATE;
			} else if (inputType == 'time') {
				uiElmDataType = DataTypes.TIME;
			} else if (inputType == 'datetime-local') {
				uiElmDataType = DataTypes.TIME;
			} else {
				uiElmDataType = DataTypes.STRING;
			}
		}

		return uiElmDataType;
	}
}

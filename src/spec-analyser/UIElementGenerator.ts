import getXPath from 'get-xpath';

import { UIElement } from './UIElement';
import { UIProperty } from './UIProperty';
import { HTMLNodeTypes } from '../html/HTMLNodeTypes';

function formatName(name: string): string {
	name = name.replace(':', '');
	name = name.charAt(0).toUpperCase() + name.slice(1);
	return name;
}

const DEFAULT_MAX_LENGTH = 524288;

export class UIElementGenerator {
	public createUIElement(
		elm: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
	): UIElement {
		let uiElm = new UIElement();

		// id
		uiElm.setProperty(new UIProperty('id', this.generateId(elm)));

		// name
		uiElm.setName(this.generateName(elm, uiElm.getId()));

		// type and dataType
		let type: string;

		if (elm instanceof HTMLSelectElement) {
			type = 'select';
		} else {
			type = elm.type ? elm.type : 'text';
		}

		uiElm.setProperty(new UIProperty('type', type));
		uiElm.setProperty(new UIProperty('dataType', type));

		// editabled
		let editabled =
			elm.disabled || (elm instanceof HTMLInputElement && elm.readOnly) ? false : true;
		uiElm.setProperty(new UIProperty('editabled', editabled));

		// value
		if (elm.value) {
			uiElm.setProperty(new UIProperty('value', elm.value));
		}

		// required
		if (elm.required) {
			uiElm.setProperty(new UIProperty('required', elm.required));
		}

		if (elm instanceof HTMLInputElement || elm instanceof HTMLTextAreaElement) {
			// min_length
			if (elm.minLength && elm.minLength !== -1) {
				uiElm.setProperty(new UIProperty('min_length', elm.minLength));
			}

			// max_length
			if (elm.maxLength && elm.maxLength !== DEFAULT_MAX_LENGTH && elm.maxLength !== -1) {
				uiElm.setProperty(new UIProperty('max_length', elm.maxLength));
			}

			if (elm instanceof HTMLInputElement) {
				// min_value
				if (elm.min) {
					uiElm.setProperty(new UIProperty('min_value', elm.min));
				}

				// max_value
				if (elm.max) {
					uiElm.setProperty(new UIProperty('max_value', elm.max));
				}
			}
		}

		return uiElm;
	}

	public createUIElementForButton(elm: HTMLButtonElement | HTMLInputElement): UIElement {
		let uiElm = new UIElement();

		// id
		uiElm.setProperty(new UIProperty('id', this.generateId(elm)));

		// name
		uiElm.setName(this.generateNameForButton(elm, uiElm.getId()));

		// type and dataType
		let type = elm.type ? elm.type : 'button';

		uiElm.setProperty(new UIProperty('type', type));

		return uiElm;
	}

	private generateName(
		elm: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
		idUiElm: string
	): string {
		let name: string = '';

		if (elm.name) {
			name = formatName(elm.name);
		} else if (elm.previousElementSibling?.nodeName === HTMLNodeTypes.LABEL) {
			name = this.generateNameFromPreviousLabel(elm);
		} else if (
			elm.previousElementSibling?.nodeName === HTMLNodeTypes.BR &&
			elm.previousElementSibling?.previousElementSibling?.nodeName === HTMLNodeTypes.LABEL
		) {
			name = this.generateNameFromPreviousLabel(elm.previousElementSibling as HTMLElement);
		} else if (
			elm.parentElement?.nodeName === HTMLNodeTypes.DIV &&
			elm.parentElement?.previousElementSibling?.nodeName === HTMLNodeTypes.LABEL
		) {
			name = this.generateNameFromPreviousLabel(elm.parentElement);
		}

		name = name ? name : elm.nodeName + idUiElm;

		return name;
	}

	private generateNameForButton(
		elm: HTMLButtonElement | HTMLInputElement,
		idUiElm: string
	): string {
		let name: string = '';

		if (elm.name) {
			name = formatName(elm.name);
		} else if (elm instanceof HTMLButtonElement && elm.innerHTML) {
			name = formatName(elm.innerHTML);
		}

		name = name ? name : 'Button' + idUiElm;

		return name;
	}

	private generateNameFromPreviousLabel(elm: HTMLElement): string {
		let label: HTMLLabelElement = elm.previousElementSibling as HTMLLabelElement;
		let name: string = '';

		if (!label.innerHTML) {
			name = formatName(label.innerHTML);
		} else if (label.htmlFor !== undefined) {
			if ((elm.id && elm.id === label.htmlFor) || elm.nodeName === HTMLNodeTypes.BR) {
				name = formatName(label.htmlFor);
			}
		}

		return name;
	}

	public generateId(elm: HTMLElement): string {
		let id = '';

		if (elm.id) {
			id = elm.id;
		} else {
			id = getXPath(elm);
		}

		return id;
	}
}
import getXPath from 'get-xpath';

import { UIElement } from '../feature/UIElement';
import { UIProperty } from '../feature/UIProperty';
import { HTMLNodeTypes } from '../html/HTMLNodeTypes';

function formatName(name: string): string {
	name = name.replace(':', '');
	name = name.charAt(0).toUpperCase() + name.slice(1);
	return name;
}

const DEFAULT_MAX_LENGTH = 524288;

export class UIElementGenerator {
	private checkValidNode(node: HTMLElement): boolean {
		// return false if node is not treatable for UIElement
		if (
			node.nodeName !== HTMLNodeTypes.INPUT &&
			node.nodeName !== HTMLNodeTypes.SELECT &&
			node.nodeName !== HTMLNodeTypes.TEXTAREA
		) {
			return false;
		}

		return true;
	}

	public createUIElementFromButton(elm: HTMLButtonElement): UIElement {
		let uiElm = new UIElement();

		return uiElm;
	}

	public createUIElementFromInput(elm: HTMLInputElement): UIElement {
		let uiElm = new UIElement();

		// name
		uiElm.setName(this.generateName(elm));

		// id
		uiElm.setProperty(new UIProperty('id', this.generateId(elm)));

		// type
		if (!elm.type) {
			let type = elm.type;

			if (elm.nodeName === HTMLNodeTypes.SELECT) {
				type = 'select';
			}

			uiElm.setProperty(new UIProperty('type', type));
		}

		// editabled
		if (!elm.disabled) {
			let editabled = !elm.disabled ? true : false;
			uiElm.setProperty(new UIProperty('editabled', editabled));
		}

		// dataType
		if (!elm.type) {
			uiElm.setProperty(new UIProperty('dataType', elm.type));
		}

		// value
		if (!elm.value) {
			uiElm.setProperty(new UIProperty('value', elm.value));
		}

		// min_length
		if (!elm.minLength) {
			uiElm.setProperty(new UIProperty('min_length', elm.minLength));
		}

		// max_length
		if (!elm.maxLength && elm.maxLength !== DEFAULT_MAX_LENGTH) {
			uiElm.setProperty(new UIProperty('max_length', elm.maxLength));
		}

		// min_value
		if (!elm.min) {
			uiElm.setProperty(new UIProperty('min_value', elm.min));
		}

		// max_value
		if (!elm.max) {
			uiElm.setProperty(new UIProperty('max_value', elm.max));
		}

		// required
		if (!elm.required) {
			uiElm.setProperty(new UIProperty('required', elm.required));
		}

		return uiElm;
	}

	private generateName(elm: HTMLElement): string {
		let name = '';

		if (elm.previousElementSibling?.nodeName === HTMLNodeTypes.LABEL) {
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
		} else {
			name = this.generateNameFromNode(elm);
		}

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

	private generateNameFromNode(elm: HTMLElement): string {
		let name: string = '';

		if (!elm.nodeName) {
			name = formatName(elm.nodeName);
		} else if (!elm.id) {
			name = formatName(elm.id.toString());
		}

		return name;
	}

	public generateId(elm: HTMLElement): string {
		let id = '';

		if (!elm.id) {
			id = elm.id;
		} else {
			id = getXPath(elm);
		}

		return id;
	}
}

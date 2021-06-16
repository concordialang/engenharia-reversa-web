import getXPath from 'get-xpath';

import { UIElement } from '../feature-structure/UIElement';
import { UIProperty } from '../feature-structure/UIProperty';
import { HTMLNodeTypes } from '../html/HTMLNodeTypes';
import { Util } from '../Util';

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

	// public createUIElementsFromForm(node: HTMLElement): Array<UIElement> {
	// 	let uiElements: Array<UIElement> = [];
	// 	let formElements: Array<HTMLFormElement> = Array.from(
	// 		node.querySelectorAll(
	// 			NodeTypes.INPUT +
	// 				', ' +
	// 				NodeTypes.SELECT +
	// 				', ' +
	// 				NodeTypes.TEXTAREA
	// 		)
	// 	);

	// 	for (let elm of formElements) {
	// 		if (!this.checkValidNode(elm)) {
	// 			// skips element if he's not valid
	// 			continue;
	// 		}

	// 		let uiElm = new UIElement();

	// 		// name
	// 		uiElm.setName(this.generateName(elm));

	// 		// id
	// 		uiElm.setProperty(new UIProperty('id', this.generateId(elm)));

	// 		// type
	// 		if (Util.isNotEmpty(elm.type)) {
	// 			let type = elm.type;

	// 			if (elm.nodeName === NodeTypes.SELECT) {
	// 				type = 'select';
	// 			}

	// 			uiElm.setProperty(new UIProperty('type', type));
	// 		}

	// 		// editabled
	// 		if (Util.isNotEmpty(elm.disabled)) {
	// 			let editabled = !elm.disabled ? true : false;
	// 			uiElm.setProperty(new UIProperty('editabled', editabled));
	// 		}

	// 		// dataType
	// 		if (Util.isNotEmpty(elm.type)) {
	// 			uiElm.setProperty(new UIProperty('dataType', elm.type));
	// 		}

	// 		// value
	// 		if (Util.isNotEmpty(elm.value)) {
	// 			uiElm.setProperty(new UIProperty('value', elm.value));
	// 		}

	// 		// min_length
	// 		if (Util.isNotEmpty(elm.minLength)) {
	// 			if (elm.minLength !== 0) {
	// 				uiElm.setProperty(
	// 					new UIProperty('min_length', elm.minLength)
	// 				);
	// 			}
	// 		}

	// 		// max_length
	// 		if (Util.isNotEmpty(elm.maxLength)) {
	// 			if (elm.maxLength !== 0 && elm.maxLength !== 524288) {
	// 				// max length input defaut
	// 				uiElm.setProperty(
	// 					new UIProperty('max_length', elm.maxLength)
	// 				);
	// 			}
	// 		}

	// 		// min_value
	// 		if (Util.isNotEmpty(elm.min)) {
	// 			uiElm.setProperty(new UIProperty('min_value', elm.min));
	// 		}

	// 		// max_value
	// 		if (Util.isNotEmpty(elm.max)) {
	// 			uiElm.setProperty(new UIProperty('max_value', elm.max));
	// 		}

	// 		// required
	// 		if (Util.isNotEmpty(elm.required)) {
	// 			uiElm.setProperty(new UIProperty('required', elm.required));
	// 		}

	// 		uiElements.push(uiElm);
	// 	}

	// 	return uiElements;
	// }

	public createUIElementFromButton(elm: HTMLButtonElement): UIElement {
		let uiElm = new UIElement();

		return uiElm;
	}

	public createUIElementFromInput(elm: HTMLInputElement): UIElement {
		// if (!this.checkValidNode(elm)) {
		// 	// skips element if he's not valid
		// 	return false;
		// }

		let uiElm = new UIElement();

		// name
		uiElm.setName(this.generateName(elm));

		// id
		uiElm.setProperty(new UIProperty('id', this.generateId(elm)));

		// type
		if (Util.isNotEmpty(elm.type)) {
			let type = elm.type;

			if (elm.nodeName === HTMLNodeTypes.SELECT) {
				type = 'select';
			}

			uiElm.setProperty(new UIProperty('type', type));
		}

		// editabled
		if (Util.isNotEmpty(elm.disabled)) {
			let editabled = !elm.disabled ? true : false;
			uiElm.setProperty(new UIProperty('editabled', editabled));
		}

		// dataType
		if (Util.isNotEmpty(elm.type)) {
			uiElm.setProperty(new UIProperty('dataType', elm.type));
		}

		// value
		if (Util.isNotEmpty(elm.value)) {
			uiElm.setProperty(new UIProperty('value', elm.value));
		}

		// min_length
		if (Util.isNotEmpty(elm.minLength)) {
			if (elm.minLength !== 0) {
				uiElm.setProperty(new UIProperty('min_length', elm.minLength));
			}
		}

		// max_length
		if (Util.isNotEmpty(elm.maxLength)) {
			if (elm.maxLength !== 0 && elm.maxLength !== 524288) {
				// max length input defaut
				uiElm.setProperty(new UIProperty('max_length', elm.maxLength));
			}
		}

		// min_value
		if (Util.isNotEmpty(elm.min)) {
			uiElm.setProperty(new UIProperty('min_value', elm.min));
		}

		// max_value
		if (Util.isNotEmpty(elm.max)) {
			uiElm.setProperty(new UIProperty('max_value', elm.max));
		}

		// required
		if (Util.isNotEmpty(elm.required)) {
			uiElm.setProperty(new UIProperty('required', elm.required));
		}

		return uiElm;
	}

	private generateName(elm: HTMLInputElement): string {
		let name = '';

		if (elm.previousElementSibling?.nodeName === HTMLNodeTypes.LABEL) {
			name = this.generateNameFromLabel(elm as HTMLInputElement);
		} else if (
			elm.parentElement?.nodeName === HTMLNodeTypes.DIV &&
			elm.parentElement?.previousElementSibling?.nodeName === HTMLNodeTypes.LABEL
		) {
			name = this.generateNameFromLabel(elm.parentElement as HTMLInputElement);
		} else {
			name = this.generateNameFromNode(elm);
		}

		return name;
	}

	private generateNameFromLabel(elm: HTMLInputElement): string {
		let label: HTMLLabelElement = elm.previousElementSibling as HTMLLabelElement;
		let name: string = '';

		if (Util.isNotEmpty(label.innerHTML)) {
			name = Util.formatName(label.innerHTML);
		} else if (label.htmlFor !== undefined) {
			if (Util.isNotEmpty(elm.id) && elm.id === label.htmlFor) {
				name = Util.formatName(label.htmlFor);
			}
		}

		return name;
	}

	private generateNameFromNode(elm: HTMLInputElement): string {
		let name: string = '';

		if (Util.isNotEmpty(elm.name)) {
			name = Util.formatName(elm.name);
		} else if (Util.isNotEmpty(elm.id)) {
			name = Util.formatName(elm.id.toString());
		}

		return name;
	}

	public generateId(elm: HTMLInputElement): string {
		let id = '';

		if (Util.isNotEmpty(elm.id)) {
			id = elm.id;
		} else {
			id = getXPath(elm);
		}

		return id;
	}
}

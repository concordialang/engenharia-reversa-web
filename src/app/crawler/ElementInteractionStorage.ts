import { stringify } from 'uuid';
import { HTMLEventType } from '../html/HTMLEventType';
import { Util } from '../Util';
import { ElementInteraction } from './ElementInteraction';

export class ElementInteractionStorage {
	private document: HTMLDocument;

	constructor(document: HTMLDocument) {
		this.document = document;
	}

	public save(key: string, elementInteraction: ElementInteraction<HTMLElement>): void {
		const pathToElement = Util.getPathTo(elementInteraction.getElement());
		const eventType = elementInteraction.getEventType();
		const value = elementInteraction.getValue();
		const pageUrl = elementInteraction.getPageUrl();
		if (pathToElement) {
			const json: {
				id: string;
				element: string;
				eventType: string;
				pageUrl: string;
				value: string | boolean | null;
				elementSelector: string | null;
			} = {
				id: elementInteraction.getId(),
				element: pathToElement,
				eventType: eventType,
				pageUrl: pageUrl.toString(),
				value: value,
				elementSelector: Util.getPathTo(elementInteraction.getElement()),
			};
			window.localStorage.setItem(key, JSON.stringify(json));
		} else {
			throw new Error('Element Interaction could not be saved because it was not possible to get its xpath');
		}
	}

	public get(key: string): ElementInteraction<HTMLElement> | null {
		const item: string | null = window.localStorage.getItem(key);
		if (item && item.length !== 0 && item.trim()) {
			const json: {
				id: string;
				element: string;
				eventType: string;
				pageUrl: string;
				value: string | boolean | null;
				elementSelector: string | null;
			} = JSON.parse(item);
			const interaction = this.createElementInteraction(json, key);
			return interaction;
		}
		return null;
	}

	public remove(key: string): void {
		window.localStorage.removeItem(key);
	}

	//criar interface serializable e colocar esses métodos nas classes respectivas

	private createElementInteraction(
		json: {
			id: string;
			element: string;
			eventType: string;
			pageUrl: string;
			value: string | boolean | null;
			elementSelector: string | null;
		},
		key: string
	): ElementInteraction<HTMLElement> | null {
		let element: HTMLElement | null = this.getElementByXpath(json.element, this.document);
		if (!element) {
			//GAMBIARRA, REFATORAR DEPOIS
			element = document.body;
		}
		const eventType = this.getEnumKeyByEnumValue(HTMLEventType, json.eventType);
		const pageUrl = json.pageUrl;
		if (eventType) {
			return new ElementInteraction(
				element,
				HTMLEventType[json.eventType],
				new URL(pageUrl),
				json.value,
				json.id,
				json.elementSelector
			);
		}
		return null;
	} // source https://stackoverflow.com/a/2631931/14729456

	/* REFATORAR, colocar em util ou helper */

	private getElementByXpath(path: string, document: HTMLDocument): HTMLElement | null {
		const node = document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
		if (node) {
			return <HTMLElement>node;
		}
		return null;
	}

	private getEnumKeyByEnumValue(myEnum, enumValue) {
		let keys = Object.keys(myEnum).filter((x) => myEnum[x] == enumValue);
		return keys.length > 0 ? myEnum[keys[0]] : null;
	}
}

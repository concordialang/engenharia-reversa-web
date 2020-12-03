import { HTMLEventType } from '../html/HTMLEventType';
import { ElementInteraction } from './ElementInteraction';

export class ElementInteractionStorage {
	private document: HTMLDocument;

	constructor(document: HTMLDocument) {
		this.document = document;
	}

	public save(key: string,elementInteraction: ElementInteraction<HTMLElement>): void {
		const pathToElement = this.getPathTo(elementInteraction.getElement());
		const eventType = elementInteraction.getEventType();
		const value = elementInteraction.getValue();
		const pageUrl = elementInteraction.getPageUrl();
		if (pathToElement) {
			const json: {element: string;eventType: string;pageUrl: string;value: string | boolean | null;} = {element: pathToElement,eventType: eventType,pageUrl: pageUrl.toString(),value: value};
			window.localStorage.setItem(key, JSON.stringify(json));
		} else {
			throw new Error(
				'Element Interaction could not be saved because it was not possible to get its xpath'
			);
		}
	}

	public get(key: string): ElementInteraction<HTMLElement> | null {
		const item: string | null = window.localStorage.getItem(key);
		if (item && item.length !== 0 && item.trim()) {
			const json: {element: string;eventType: string;pageUrl: string;value: string | boolean | null} = JSON.parse(item);
			const interaction = this.createElementInteraction(json, key);
			return interaction;
		}
		return null;
	}

	public remove(key: string): void {
		window.localStorage.removeItem(key);
	}

	//criar interface serializable e colocar esses métodos nas classes respectivas

	private createElementInteraction(json: {element: string;eventType: string;pageUrl: string;value: string | boolean | null},key: string): ElementInteraction<HTMLElement> | null {
		const element = this.getElementByXpath(json.element, this.document);
		const eventType = HTMLEventType[json.eventType];
		const pageUrl = json.pageUrl;
		if (element && eventType) {
			return new ElementInteraction(element,HTMLEventType[json.eventType],new URL(pageUrl),json.value,key);
		}
		return null;
	}

	/* REFATORAR, colocar em util ou helper */ // source https://stackoverflow.com/a/2631931/14729456
	private getPathTo(element: HTMLElement): string | null {
		if (element.id !== '') return 'id("' + element.id + '")';
		if (element === document.body) return element.tagName;

		var ix = 0;
		const parentNode = element.parentNode;
		if (parentNode) {
			var siblings = parentNode.childNodes;
			for (var i = 0; i < siblings.length; i++) {
				var sibling = <HTMLElement>siblings[i];
				if (sibling === element)
					return (this.getPathTo(<HTMLElement>parentNode) +'/' +element.tagName +'[' +(ix + 1) +']');
				if (
					sibling.nodeType === 1 &&
					sibling.tagName === element.tagName
				)
					ix++;
			}
		}

		return null;
	}

	/* REFATORAR, colocar em util ou helper */ 
	private getElementByXpath(path: string, document: HTMLDocument): HTMLElement | null {
		const node = document.evaluate(path,document,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;
		if (node) {
			return <HTMLElement>node;
		}
		return null;
	}
}

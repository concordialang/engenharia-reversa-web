import { HTMLEventType } from '../html/HTMLEventType';
import { getElementByXpath, getEnumKeyByEnumValue, getPathTo } from '../util';
import { ElementInteraction } from '../crawler/ElementInteraction';
import { LocalObjectStorage } from './LocalObjectStorage';
export class ElementInteractionStorage extends LocalObjectStorage<ElementInteraction<HTMLElement>> {
	private document: HTMLDocument;

	constructor(localStorage: Storage, document: HTMLDocument) {
		super(localStorage);
		this.document = document;
	}

	protected stringifyObject(obj: ElementInteraction<HTMLElement>): string {
		const pathToElement = getPathTo(obj.getElement());
		const eventType = obj.getEventType();
		const value = obj.getValue();
		const pageUrl = obj.getPageUrl();
		if (pathToElement) {
			const json: {
				id: string;
				element: string;
				eventType: string;
				pageUrl: string;
				value: string | boolean | null;
				elementSelector: string | null;
			} = {
				id: obj.getId(),
				element: pathToElement,
				eventType: eventType,
				pageUrl: pageUrl.toString(),
				value: value,
				elementSelector: getPathTo(obj.getElement()),
			};
			return JSON.stringify(json);
		} else {
			throw new Error(
				'Element Interaction could not be saved because it was not possible to get its xpath'
			);
		}
	}

	protected mapJsonToObject(json: {
		id: string;
		element: string;
		eventType: string;
		pageUrl: string;
		value: string | boolean | null;
		elementSelector: string | null;
	}): ElementInteraction<HTMLElement> {
		let element: HTMLElement | null = getElementByXpath(json.element, this.document);
		if (!element) {
			// FIXME Pensar em solução pros casos onde a interação ocorreu em outra página e não é possível obter o elemento da página da tual
			element = document.body;
		}
		//FIXME Usar a função de getEnumKeyByEnumValue da Util
		const eventType = getEnumKeyByEnumValue(HTMLEventType, json.eventType);
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
		} else {
			throw new Error('Unable to get interaction event type');
		}
	}
}

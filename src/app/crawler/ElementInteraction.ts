import { HTMLEventType } from '../html/HTMLEventType';

export class ElementInteraction<T extends HTMLElement> {
	private element: T;
	private eventType: HTMLEventType;
	private pageUrl: URL;
	private value: string | boolean | null;
	private id: string;
	private elementSelector: string | null;

	constructor(
		element: T,
		eventType: HTMLEventType,
		pageUrl: URL,
		value: string | boolean | null = null,
		id: string | null = null,
		elementSelector?: string | null
	) {
		this.element = element;
		this.eventType = eventType;
		this.pageUrl = pageUrl;
		this.value = value;
		this.id = id || Math.random().toString(18).substring(2);
		this.elementSelector = elementSelector ? elementSelector : null;
	}

	public getElement(): T {
		return this.element;
	}

	public getEventType(): HTMLEventType {
		return this.eventType;
	}

	public getPageUrl(): URL {
		return this.pageUrl;
	}

	public getValue(): string | boolean | null {
		return this.value;
	}

	public getId(): string {
		return this.id;
	}

	public getElementSelector(): string | null {
		return this.elementSelector;
	}
}

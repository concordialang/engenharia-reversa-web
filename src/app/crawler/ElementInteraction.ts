import { HTMLEventType } from '../html/HTMLEventType';

export class ElementInteraction<T extends HTMLElement> {
	private element: T;
	private eventType: HTMLEventType;
	private pageUrl: URL;
	private value: string | boolean | null;
	private id: string | null;

	constructor(
		element: T,
		eventType: HTMLEventType,
		pageUrl: URL,
		value: string | boolean | null = null,
		id: string | null = null
	) {
		this.element = element;
		this.eventType = eventType;
		this.pageUrl = pageUrl;
		this.value = value;
		this.id = id;
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

	public getId(): string | null {
		return this.id;
	}
}

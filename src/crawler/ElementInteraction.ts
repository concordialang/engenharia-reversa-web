import { HTMLEventType } from '../types/HTMLEventType';
import { Variant } from '../spec-analyser/Variant';

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
		//FIXME Remover esse argumento, pois id é gerado internamente
		id: string | null = null,
		elementSelector?: string | null,
		private variant?: Variant | null
	) {
		this.element = element;
		this.eventType = eventType;
		this.pageUrl = pageUrl;
		this.value = value;
		this.id = id || Math.random().toString(18).substring(2);
		this.elementSelector = elementSelector ? elementSelector : null;
		this.variant = variant ? variant : null;
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

	public getVariant(): Variant | null {
		return this.variant ? this.variant : null;
	}

	public setVariant(variant: Variant) {
		this.variant = variant;
	}
}

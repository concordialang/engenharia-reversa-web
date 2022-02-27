import { Transform, Type } from 'class-transformer';
import { TransformHTMLElement, TransformURL } from '../decorators';
import { HTMLEventType } from '../enums/HTMLEventType';
import { Feature } from '../spec-analyser/Feature';
import { Variant } from '../spec-analyser/Variant';

export class ElementInteraction<T extends HTMLElement> {
	@TransformHTMLElement()
	private element: T;
	private eventType: HTMLEventType;
	@TransformURL()
	private pageUrl: URL;
	private value: string | boolean | null;
	private id: string;
	private causedRedirection: boolean = false;

	@Transform(
		(params) => (params.obj.elementSelector ? params.obj.elementSelector : params.obj.element),
		{ toClassOnly: true }
	)
	private elementSelector: string | null;

	@Type(() => Variant)
	private variant?: Variant | string | null;

	@Type(() => Feature)
	private feature?: Feature | string | null;

	constructor(
		element: T,
		eventType: HTMLEventType,
		pageUrl: URL,
		value: string | boolean | null = null,
		id: string | null = null,
		elementSelector?: string | null,
		variant?: Variant | null,
		feature?: Feature | string | null
	) {
		this.element = element;
		this.eventType = eventType;
		this.pageUrl = pageUrl;
		this.value = value;
		this.id = id || Math.random().toString(18).substring(2);
		this.elementSelector = elementSelector ? elementSelector : null;
		this.variant = variant ? variant : null;
		this.feature = feature ? feature : null;
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

	public setValue(value: string | boolean | null) {
		this.value = value;
	}

	public getId(): string {
		return this.id;
	}

	public getElementSelector(): string | null {
		return this.elementSelector;
	}

	public getVariant(): Variant | string | null {
		return this.variant ? this.variant : null;
	}

	public getFeature(): Feature | string | null {
		return this.feature ? this.feature : null;
	}

	public setFeature(feature: Feature | string | null) {
		this.feature = feature;
	}

	public setVariant(variant: Variant | string | null) {
		this.variant = variant;
	}

	public setCausedRedirection(causedRedirection: boolean): void {
		this.causedRedirection = causedRedirection;
	}

	public getCausedRedirection(): boolean {
		return this.causedRedirection;
	}
}

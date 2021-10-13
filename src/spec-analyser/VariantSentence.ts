import { Transform, Type } from 'class-transformer';
import { UIElement } from './UIElement';
import 'reflect-metadata';
import { TransformURL } from '../decorators';

export class VariantSentence {
	@Type(() => UIElement)
	public uiElement?: UIElement;

	@TransformURL()
	public url?: URL;

	constructor(
		public type: string,
		public action: string,
		uiElement?: UIElement,
		public attributtes?: Array<{ property: string; value: string }>,
		url?: URL,
		public statePostCondition?: string
	) {
		this.uiElement = uiElement;
		this.url = url;
	}
}

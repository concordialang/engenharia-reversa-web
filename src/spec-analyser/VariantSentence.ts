import { Type } from 'class-transformer';
import { UIElement } from './UIElement';
import 'reflect-metadata';

export class VariantSentence {
	@Type(() => UIElement)
	public uiElement?: UIElement;

	constructor(
		public type: string,
		public action: string,
		uiElement?: UIElement,
		public attributtes?: Array<{ property: string; value: string }>,
		public url?: URL,
		public statePostCondition?: string
	) {
		this.uiElement = uiElement;
	}
}

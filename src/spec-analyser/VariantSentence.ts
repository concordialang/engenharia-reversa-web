import { UIElement } from './UIElement';

export class VariantSentence {
	constructor(
		public type: string,
		public action: string,
		public uiElement: UIElement,
		public attributtes?: Array<{ property: string; value: string }>
	) {}
}

import { VariantSentenceType } from '../types/VariantSentenceType';
import { UIElement } from './UIElement';

export class VariantSentence {
	constructor(
		public type: VariantSentenceType,
		public action: string,
		public targets: Array<string>,
		public attributtes?: Array<{ property: string; value: string }>,
		public uiElement?: UIElement
	) {}
}

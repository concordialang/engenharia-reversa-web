import { VariantSentenceType } from '../types/VariantSentenceType';

export class VariantSentence {
	constructor(
		public type: VariantSentenceType,
		public action: string,
		public targets: Array<string>,
		public attributtes?: Array<{ property: string; value: string }>
	) {}
}

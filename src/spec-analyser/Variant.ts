import { VariantSentence } from './VariantSentence';

export class Variant {
	private name!: string;
	private sentences!: Array<VariantSentence>;
	public last!: boolean;

	constructor() {
		this.sentences = [];
	}

	public setName(name: string) {
		this.name = name;
	}

	public getName() {
		return this.name;
	}

	public setVariantSentence(variantSentence: VariantSentence) {
		this.sentences.push(variantSentence);
	}

	public setVariantsSentences(variantsSentences: VariantSentence[]) {
		if (variantsSentences.length > 0) {
			this.sentences = this.sentences.concat(variantsSentences);
		}
	}

	public getVariant() {
		return this.sentences;
	}

	public getSentences() {
		return this.sentences;
	}
}

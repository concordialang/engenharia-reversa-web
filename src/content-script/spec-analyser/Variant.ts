import { Type } from 'class-transformer';
import { VariantSentenceType } from '../enums/VariantSentenceType';
import { VariantSentence } from './VariantSentence';
import 'reflect-metadata';

export class Variant {
	private name!: string;
	private id: string;

	@Type(() => VariantSentence)
	private sentences!: Array<VariantSentence>;

	public lastAnalysisInputFieldFound = false;
	public finalActionButtonFound = false;

	constructor(id?: string) {
		this.sentences = [];
		this.id = id || Math.random().toString(18).substring(2);
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

	public isValid() {
		return this.sentences.some((sentence) => {
			return (
				sentence.type !== VariantSentenceType.GIVEN &&
				sentence.type !== VariantSentenceType.THEN
			);
		});
	}

	public getNumberOfAnalyzedButtons() {
		const btnSentences = this.sentences.filter(
			(sentence) => sentence.uiElement?.getType() === 'button'
		);

		return btnSentences.length;
	}
}

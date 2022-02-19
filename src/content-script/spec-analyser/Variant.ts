import { Type } from 'class-transformer';
import { VariantSentenceType } from '../enums/VariantSentenceType';
import { VariantSentence } from './VariantSentence';
import 'reflect-metadata';
import { HTMLInputType } from '../enums/HTMLInputType';
import { UiElementsTypes } from '../enums/UiElementsTypes';

export class Variant {
	private name!: string;
	private id: string;

	@Type(() => VariantSentence)
	private sentences!: Array<VariantSentence>;

	public lastAnalysisInputFieldFound = false;
	public finalActionClicableFound = false;
	public whenSentenceCreated = false;

	constructor(id?: string) {
		this.sentences = [];
		this.id = id || Math.random().toString(18).substring(2);
	}

	public getId() {
		return this.id;
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

	public getClicablesElements(): HTMLElement[] {
		let sourceElements: HTMLElement[] = [];

		const clicableSentences = this.sentences.filter(
			(sentence) => sentence.uiElement?.getType() === UiElementsTypes.Button || sentence.uiElement?.getType() === UiElementsTypes.Link
		);

		for (let sentence of clicableSentences) {
			let elm = sentence.uiElement?.getSourceElement();

			if (elm) {
				sourceElements.push(elm as HTMLElement);
			}
		}

		return sourceElements;
	}

	public getLastClicableInteracted(): HTMLButtonElement | HTMLInputElement | HTMLAnchorElement | null {
		const clicables = this.getClicablesElements();

		const length = clicables.length;

		if (length > 0) {
			const lastElm = clicables[length - 1];

			if (
				lastElm instanceof HTMLButtonElement ||
				lastElm instanceof HTMLAnchorElement ||
				(lastElm instanceof HTMLInputElement &&
					(lastElm.type === HTMLInputType.Submit ||
						lastElm.type === HTMLInputType.Button ||
						lastElm.type === HTMLInputType.Reset))
			) {
				return lastElm;
			}
		}

		return null;
	}
}

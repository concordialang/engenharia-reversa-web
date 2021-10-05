import { HTMLElementType } from '../enums/HTMLElementType';
import { MutationObserverManager } from '../mutation-observer/MutationObserverManager';
import { ElementInteractionExecutor } from '../crawler/ElementInteractionExecutor';
import { ElementInteractionGenerator } from '../crawler/ElementInteractionGenerator';
import { ElementInteraction } from '../crawler/ElementInteraction';
import { Variant } from './Variant';
import { FeatureUtil } from './FeatureUtil';
import { VariantSentence } from './VariantSentence';
import { getPathTo } from '../util';

export class VariantGenerator {
	constructor(
		private elementInteractionGenerator: ElementInteractionGenerator,
		private elementInteractionExecutor: ElementInteractionExecutor,
		private featureUtil: FeatureUtil
	) {}

	public async generate(
		analysisElement: HTMLElement,
		url: URL,
		observer: MutationObserverManager,
		ignoreFormElements: boolean,
		featureName: string,
		variantsCount: number,
		redirectionCallback?: (interaction: ElementInteraction<HTMLElement>) => Promise<void>
	): Promise<Variant | null> {
		let variant = this.featureUtil.createVariant(featureName, variantsCount);

		let firstAnalyzeSentence = true;

		const analyse = async (elm) => {
			let checkRowChilds = false;
			if (elm instanceof HTMLTableRowElement) {
				checkRowChilds = await this.treatTableRow(elm, variant, observer);
			}

			const validFirstChild = await this.checkValidFirstChild(
				elm,
				ignoreFormElements,
				checkRowChilds
			);
			if (validFirstChild) {
				await analyse(elm.firstElementChild);
			}

			if (!this.checkValidInteractableElement(elm)) {
				if (elm.nextElementSibling) {
					await analyse(elm.nextElementSibling);
				}
				return;
			}

			const interaction = await this.elementInteractionGenerator.generate(elm, variant);
			if (!interaction) {
				if (elm.nextElementSibling) {
					await analyse(elm.nextElementSibling);
				}
				return;
			}

			const result = await this.elementInteractionExecutor.execute(
				interaction,
				redirectionCallback,
				true
			);
			if (result && result.getTriggeredRedirection()) {
				return variant;
			}

			const variantSentence: VariantSentence | null = this.featureUtil.createVariantSentence(
				elm,
				firstAnalyzeSentence
			);
			if (firstAnalyzeSentence) {
				firstAnalyzeSentence = false;
			}

			if (!variantSentence) {
				if (elm.nextElementSibling) {
					await analyse(elm.nextElementSibling);
				}
				return;
			}

			variant.setVariantSentence(variantSentence);

			const mutationVariantSentences = this.treatMutationsSentences(observer);
			if (mutationVariantSentences.length > 0) {
				variant.setVariantsSentences(mutationVariantSentences);
			}

			if (elm.nextElementSibling) {
				await analyse(elm.nextElementSibling);
			}
		};

		let startElement: HTMLElement = analysisElement.firstElementChild as HTMLElement;
		if (!startElement) {
			return null;
		}

		const givenTypeSentence = this.featureUtil.createGivenTypeVariantSentence(url);
		if (givenTypeSentence) {
			variant.setVariantSentence(givenTypeSentence);
			await analyse(startElement);
		}

		this.elementInteractionGenerator.resetFilledRadioGroups();

		variant.setVariantSentence(this.featureUtil.createThenTypeVariantSentence(featureName));
		variant.last = true;
		return variant;
	}

	private async checkValidFirstChild(elm, ignoreFormElements, checkRowChilds): Promise<boolean> {
		if (elm.firstElementChild && elm.firstElementChild.nodeName !== HTMLElementType.OPTION) {
			if (elm instanceof HTMLTableRowElement) {
				return checkRowChilds;
			}

			if (!ignoreFormElements || elm.nodeName !== HTMLElementType.FORM) {
				return true;
			}
		}

		return false;
	}

	private async treatTableRow(
		elm: HTMLElement,
		variant: Variant,
		observer: MutationObserverManager
	) {
		let checkRowChilds = false;

		const row = await this.checkValidRowTable(elm);
		if (row.isValid) {
			if (row.type == 'header') {
				await this.interactWithTableColumn(elm, variant, observer);
			} else if (row.type == 'content') {
				checkRowChilds = true;
				await this.interactWithTableContentRow(elm, variant, observer);
			}
		}

		return checkRowChilds;
	}

	// check if element is the first content row or the first header row of the table
	private async checkValidRowTable(elm: HTMLElement) {
		const xpathRowElement = getPathTo(elm);

		let row = {
			isValid: false,
			type: '',
		};

		if (elm.offsetParent && elm.offsetParent instanceof HTMLTableElement) {
			const xpathTableFirstRowHeader = getPathTo(
				elm.offsetParent.getElementsByTagName('th')[0].parentElement as HTMLElement
			);

			const xpathTableFirstRowContent = getPathTo(
				elm.offsetParent.getElementsByTagName('td')[0].parentElement as HTMLElement
			);

			if (xpathRowElement == xpathTableFirstRowHeader) {
				row.isValid = true;
				row.type = 'header';
			}

			if (xpathRowElement == xpathTableFirstRowContent) {
				row.isValid = true;
				row.type = 'content';
			}
		}

		return row;
	}

	// interacts and get mutation sentences (if exists) of the first content table row
	private async interactWithTableContentRow(
		row,
		variant: Variant,
		observer: MutationObserverManager
	): Promise<boolean | null> {
		const interaction = await this.elementInteractionGenerator.generate(row, variant);
		if (!interaction) {
			return null;
		}

		const result = await this.elementInteractionExecutor.execute(interaction, undefined, false);
		if (!result) {
			return null;
		}

		const variantSentence: VariantSentence | null = this.featureUtil.createVariantSentence(row);
		if (!variantSentence) {
			return null;
		}

		variant.setVariantSentence(variantSentence);

		const mutationVariantSentences = this.treatMutationsSentences(observer);

		if (!mutationVariantSentences) {
			return null;
		}

		variant.setVariantsSentences(mutationVariantSentences);

		return true;
	}

	// interacts and get mutation sentences (if exists) of the second column of table
	private async interactWithTableColumn(
		row,
		variant: Variant,
		observer: MutationObserverManager
	) {
		let column: HTMLElement | null = null;

		if (row.childElementCount > 0) {
			column = row.childElementCount >= 2 ? row.cells[1] : row.cells[0];
		}

		if (!column) {
			return null;
		}

		const interaction = await this.elementInteractionGenerator.generate(column, variant);
		if (!interaction) {
			return null;
		}

		const result = await this.elementInteractionExecutor.execute(interaction, undefined, false);
		if (!result) {
			return null;
		}

		const variantSentence: VariantSentence | null = this.featureUtil.createVariantSentence(row);
		if (!variantSentence) {
			return null;
		}

		variant.setVariantSentence(variantSentence);

		const mutationVariantSentences = this.treatMutationsSentences(observer);
		if (!mutationVariantSentences) {
			return null;
		}

		variant.setVariantsSentences(mutationVariantSentences);

		return true;
	}

	private checkValidInteractableElement(elm) {
		if (
			!(elm instanceof HTMLInputElement) &&
			!(elm instanceof HTMLSelectElement) &&
			!(elm instanceof HTMLTextAreaElement) &&
			!(elm instanceof HTMLButtonElement)
		) {
			return false;
		}

		if (
			elm.disabled ||
			elm.hidden ||
			elm.style.display === 'none' ||
			elm.style.visibility === 'hidden'
		) {
			return false;
		}

		if (elm instanceof HTMLInputElement || elm instanceof HTMLTextAreaElement) {
			if (elm.readOnly) {
				return false;
			}

			if (elm instanceof HTMLInputElement && elm.type === 'hidden') {
				return false;
			}
		}

		return true;
	}

	private treatMutationsSentences(observer: MutationObserverManager): VariantSentence[] {
		let mutations: MutationRecord[] = observer.getMutations();
		let mutationSentences: VariantSentence[] = [];

		if (mutations.length == 0) {
			mutations = observer.getRecords();
		}

		if (mutations.length > 0) {
			for (let mutation of mutations) {
				const mutationSentence = this.featureUtil.createMutationVariantSentences(mutation);

				if (!mutationSentence) {
					continue;
				}

				mutationSentences = mutationSentences.concat(mutationSentence);
			}
		}

		observer.resetMutations();

		return mutationSentences;
	}
}

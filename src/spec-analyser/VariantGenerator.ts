import { HTMLElementType } from '../enums/HTMLElementType';
import { MutationObserverManager } from '../mutation-observer/MutationObserverManager';
import { ElementInteractionExecutor } from '../crawler/ElementInteractionExecutor';
import { ElementInteractionGenerator } from '../crawler/ElementInteractionGenerator';
import { ElementInteraction } from '../crawler/ElementInteraction';
import { Variant } from './Variant';
import { FeatureUtil } from './FeatureUtil';
import { VariantSentence } from './VariantSentence';
import { getPathTo } from '../util';
import { Feature } from './Feature';

let needNewVariant = false;

export class VariantGenerator {
	constructor(
		private elementInteractionGenerator: ElementInteractionGenerator,
		private elementInteractionExecutor: ElementInteractionExecutor,
		private featureUtil: FeatureUtil,
		private dictionary
	) {}

	public async generate(
		analysisElement: HTMLElement,
		url: URL,
		observer: MutationObserverManager,
		ignoreFormElements: boolean,
		feature: Feature,
		redirectionCallback?: (interaction: ElementInteraction<HTMLElement>) => Promise<void>
	): Promise<Variant | null> {
		const scenario = feature.getGeneralScenario();
		let variant = this.featureUtil.createVariant(
			feature.getName(),
			scenario.getVariantsCount()
		);

		needNewVariant = false;
		let firstAnalyzeSentence = true;
		variant.last = true;

		const analyse = async (elm) => {
			let checksRowChilds = false;
			if (elm instanceof HTMLTableRowElement) {
				checksRowChilds = await this.treatTableRow(elm, variant, observer);
			}

			const validFirstChild = await this.checksValidFirstChild(
				elm,
				ignoreFormElements,
				checksRowChilds
			);
			if (validFirstChild) {
				await analyse(elm.firstElementChild);
			}

			if (!this.checkValidInteractableElement(elm, variant.getName(), feature)) {
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

			if (!result) {
				if (elm.nextElementSibling) {
					await analyse(elm.nextElementSibling);
				}
				return;
			}

			this.saveInteractedElement(elm, variant.getName(), feature);

			if (result.getTriggeredRedirection()) {
				return variant;
			}

			const variantSentence: VariantSentence | null = this.featureUtil.createVariantSentence(
				elm,
				firstAnalyzeSentence
			);

			if (!variantSentence) {
				if (elm.nextElementSibling) {
					await analyse(elm.nextElementSibling);
				}
				return;
			}

			if (firstAnalyzeSentence) {
				firstAnalyzeSentence = false;
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

		variant.last = !needNewVariant;

		this.elementInteractionGenerator.resetFilledRadioGroups();

		variant.setVariantSentence(
			this.featureUtil.createThenTypeVariantSentence(feature.getName())
		);
		return variant;
	}

	private async checksValidFirstChild(
		elm,
		ignoreFormElements,
		checksRowChilds
	): Promise<boolean> {
		if (elm.firstElementChild && elm.firstElementChild.nodeName !== HTMLElementType.OPTION) {
			if (elm instanceof HTMLTableRowElement) {
				return checksRowChilds;
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

	// check if the element is ready to receive interaction
	private checkValidInteractableElement(
		elm: HTMLElement,
		currentVariantName: string,
		feature: Feature
	) {
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

		return this.checksPreviousValidInteractions(elm, currentVariantName, feature);
	}

	/*
		Checks previous interactions throughout feature
		Some elements force creations of new variants and cannot have repeated interactions (checkbox, radio, button)
	*/
	private checksPreviousValidInteractions(
		elm: HTMLElement,
		currentVariantName: string,
		feature: Feature
	): boolean {
		if (
			!(elm instanceof HTMLInputElement && (elm.type == 'checkbox' || elm.type == 'radio')) &&
			!(elm instanceof HTMLInputElement && (elm.type == 'button' || elm.type == 'submit')) &&
			!(elm instanceof HTMLButtonElement)
		) {
			return true;
		}

		const xpathElement = getPathTo(elm);

		const alreadyInteracted = feature.InteractedElements.some(
			(interactedElm) => interactedElm.xpath === xpathElement
		);

		const isFinalActionButton = this.checskIfIsFinalActionButton(elm);

		if (alreadyInteracted && !isFinalActionButton) {
			return false;
		}

		if (elm instanceof HTMLInputElement && elm.type == 'radio') {
			// checks if some group radio button received interaction in this variant
			const anyOfGroupHasInteracted = feature.InteractedElements.some((radio) => {
				return radio.variantName === currentVariantName && radio.radioGroupName == elm.name;
			});

			if (anyOfGroupHasInteracted) {
				return false;
			}
		}

		if (
			(elm instanceof HTMLInputElement && (elm.type == 'button' || elm.type == 'submit')) ||
			elm instanceof HTMLButtonElement
		) {
			const anyButtonHasInteracted = feature.InteractedElements.some((btn) => {
				return btn.variantName === currentVariantName && btn.elmType === 'button';
			});

			if (anyButtonHasInteracted && !isFinalActionButton) {
				return false;
			}
		}

		const scenario = feature.getGeneralScenario();

		needNewVariant =
			scenario.getVariantsCount() < scenario.getMaxVariantsCount() - 1 ? true : false;

		return true;
	}

	private checskIfIsFinalActionButton(elm: HTMLInputElement | HTMLButtonElement): boolean {
		if (
			!(elm instanceof HTMLInputElement && (elm.type == 'button' || elm.type == 'submit')) &&
			!(elm instanceof HTMLButtonElement)
		) {
			return false;
		}

		let isFinalActionBtn: boolean = false;

		if (elm.type === 'submit') {
			isFinalActionBtn = true;
		} else {
			const findFinalActionString = (propertyBtn) => {
				isFinalActionBtn = this.dictionary.stringsFinalActionButtons.some((str) => {
					return this.areSimilar(propertyBtn, str);
				});
			};

			if (elm.innerText) {
				findFinalActionString(elm.innerText);
			}

			if (elm.name && !isFinalActionBtn) {
				findFinalActionString(elm.name);
			}

			if (elm.id && !isFinalActionBtn) {
				findFinalActionString(elm.id);
			}

			if (elm.value && !isFinalActionBtn) {
				findFinalActionString(elm.value);
			}
		}

		return isFinalActionBtn;
	}

	private areSimilar(text1: string, text2: string, options?): boolean {
		return text1.toLowerCase().includes(text2.toLowerCase());
	}

	private saveInteractedElement(
		elm: HTMLElement,
		currentVariantName: string,
		feature: Feature
	): void {
		const xpathElement = getPathTo(elm);
		const indexAnalyzedElm = feature.InteractedElements.findIndex(
			(analyzedElms) => analyzedElms.xpath === xpathElement
		);

		if (indexAnalyzedElm !== -1) {
			feature.InteractedElements[indexAnalyzedElm].count++;
		} else {
			let interactedElm: any = {
				xpath: xpathElement,
				count: 1,
				variantName: currentVariantName,
				elmType: elm.nodeName.toLowerCase(),
			};

			if (elm instanceof HTMLInputElement && elm.type == 'radio' && elm.name) {
				interactedElm.radioGroupName = elm.name;
				interactedElm.elmType = 'radio';
			} else if (
				(elm instanceof HTMLInputElement &&
					(elm.type == 'button' || elm.type == 'submit')) ||
				elm instanceof HTMLButtonElement
			) {
				interactedElm.elmType = 'button';
			}

			feature.InteractedElements.push(interactedElm);
		}
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

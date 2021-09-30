import { HTMLElementType } from '../types/HTMLElementType';
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
		private elementInteractionExecutor: ElementInteractionExecutor,
		private elementInteractionGenerator: ElementInteractionGenerator,
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
			const validFirstChild = await this.checkValidFirstChild(
				elm,
				ignoreFormElements,
				variant
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

			observer.resetMutations();

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

	private async checkValidFirstChild(elm, ignoreFormElements, variant): Promise<boolean> {
		if (elm.firstElementChild && elm.firstElementChild.nodeName !== HTMLElementType.OPTION) {
			if (elm instanceof HTMLTableRowElement) {
				if (await this.checkValidRowTable(elm, variant)) {
					return true;
				}
			} else if (!ignoreFormElements || elm.nodeName !== HTMLElementType.FORM) {
				return true;
			}
		}

		return false;
	}

	// check if element is the first content row or the first header row of the table and interact with it
	private async checkValidRowTable(elm, variant: Variant): Promise<boolean> {
		const xpathRowElement = getPathTo(elm as HTMLElement);
		if (elm.offsetParent && elm.offsetParent instanceof HTMLTableElement) {
			const xpathTableFirstRowContent = getPathTo(
				elm.offsetParent.getElementsByTagName('td')[0].parentElement as HTMLElement
			);
			const xpathTableFirstRowHeader = getPathTo(
				elm.offsetParent.getElementsByTagName('th')[0].parentElement as HTMLElement
			);

			if (
				xpathRowElement == xpathTableFirstRowContent ||
				xpathRowElement == xpathTableFirstRowHeader
			) {
				// interactable row
				if (xpathRowElement == xpathTableFirstRowContent) {
					const interaction = await this.elementInteractionGenerator.generate(
						elm,
						variant
					);
					if (interaction) {
						await this.elementInteractionExecutor.execute(
							interaction,
							undefined,
							false
						);
					}
				}

				return true;
			}
		}

		return false;
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

		return mutationSentences;
	}
}

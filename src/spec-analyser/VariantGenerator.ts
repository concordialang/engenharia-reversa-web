import { HTMLNodeTypes } from '../html/HTMLNodeTypes';
import { MutationObserverManager } from '../mutation-observer/MutationObserverManager';
import { ElementInteractionExecutor } from '../crawler/ElementInteractionExecutor';
import { ElementInteractionGenerator } from '../crawler/ElementInteractionGenerator';
import { ElementInteraction } from '../crawler/ElementInteraction';
import { Variant } from './Variant';
import { FeatureUtil } from './FeatureUtil';
import { VariantSentence } from './VariantSentence';
import getXPath from 'get-xpath';

export class VariantGenerator {
	constructor(
		private elementInteractionExecutor: ElementInteractionExecutor,
		private elementInteractionGenerator: ElementInteractionGenerator,
		private featureUtil: FeatureUtil
	) {}

	public async generate(
		analysisElement: HTMLElement,
		observer: MutationObserverManager,
		ignoreFeatureTags: boolean,
		redirectionCallback?: (interaction: ElementInteraction<HTMLElement>) => Promise<void>
	): Promise<Variant | null> {
		const variant = this.featureUtil.createVariant();

		const analyse = async (elm) => {
			if (this.checkValidFirstChild(elm, ignoreFeatureTags)) {
				await analyse(elm.firstElementChild);
			}

			if (!this.checkValidInteractableElement(elm)) {
				if (elm.nextElementSibling) {
					await analyse(elm.nextElementSibling);
				}
				return;
			}

			const interaction = await this.elementInteractionGenerator.generate(elm);
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

			const variantSentence = this.featureUtil.createVariantSentence(elm);
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

		let element: HTMLElement = analysisElement.firstElementChild as HTMLElement;
		if (element) {
			await analyse(analysisElement.firstElementChild as HTMLElement);
		}

		this.elementInteractionGenerator.resetFilledRadioGroups();

		variant.last = true;
		return variant;
	}

	private checkValidFirstChild(elm, ignoreFeatureTags): boolean {
		if (elm.firstElementChild && elm.firstElementChild.nodeName !== HTMLNodeTypes.OPTION) {
			if (
				!ignoreFeatureTags ||
				(elm.nodeName !== HTMLNodeTypes.FORM && elm.nodeName !== HTMLNodeTypes.TABLE)
			) {
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
				const mutationSentence = this.featureUtil.createMutationVariantSentence(mutation);

				if (!mutationSentence) {
					continue;
				}

				mutationSentences = mutationSentences.concat(mutationSentence);
			}
		}

		return mutationSentences;
	}
}

import { HTMLNodeTypes } from '../html/HTMLNodeTypes';
import { MutationObserverManager } from '../mutation-observer/MutationObserverManager';
import { ElementInteractionExecutor } from '../crawler/ElementInteractionExecutor';
import { ElementInteractionGenerator } from '../crawler/ElementInteractionGenerator';
import { ElementInteraction } from '../crawler/ElementInteraction';
import { Variant } from './Variant';
import { FeatureUtil } from './FeatureUtil';
import { UIElement } from './UIElement';
import { VariantSentenceActions } from '../types/VariantSentenceActions';

export class VariantGenerator {
	constructor(
		private elementInteractionExecutor: ElementInteractionExecutor,
		private elementInteractionGenerator: ElementInteractionGenerator,
		private featureUtil: FeatureUtil
	) {}

	public async generate(
		analyzedElement: HTMLElement,
		redirectionCallback?: (interaction: ElementInteraction<HTMLElement>) => Promise<void>,
		ignoreFormElements: boolean = false
	): Promise<Variant[]> {
		let interactableElements: any[] = ignoreFormElements
			? this.getInteractableElementsIgnoringForm(analyzedElement)
			: this.getInteractableElements(analyzedElement);

		let variants: Variant[] = [];
		if (interactableElements.length <= 0) {
			let observer = new MutationObserverManager(analyzedElement);

			let variant: Variant | null;
			do {
				variant = await this.generateVariant(
					interactableElements,
					observer,
					redirectionCallback
				);
				if (variant) {
					variants.push(variant);
				}
			} while (variant && !variant.last);

			observer.disconnect();
		}

		return variants;
	}

	public async generateVariant(
		interactableElements: any[],
		observer: MutationObserverManager,
		redirectionCallback?: (interaction: ElementInteraction<HTMLElement>) => Promise<void>
	): Promise<Variant | null> {
		const variant = this.featureUtil.createVariant();

		for (const element of interactableElements) {
			const interaction = this.elementInteractionGenerator.generate(element as HTMLElement);

			if (!interaction) {
				continue;
			}

			const result = await this.elementInteractionExecutor.execute(
				interaction,
				redirectionCallback,
				true
			);

			if (result && result.getTriggeredRedirection()) {
				return variant;
			}

			let uiElement: UIElement | null = null;

			if (
				element instanceof HTMLInputElement ||
				element instanceof HTMLSelectElement ||
				element instanceof HTMLTextAreaElement ||
				element instanceof HTMLButtonElement
			) {
				uiElement = this.featureUtil.createUiElment(element);
			}

			if (!uiElement) {
				continue;
			}

			const variantSentence = this.featureUtil.createVariantSentence(uiElement);

			if (!variantSentence) {
				continue;
			}

			variant.setVariantSentence(variantSentence);

			let mutations = observer.getMutations();

			if (mutations.length == 0) {
				mutations = observer.getRecords();
			}

			if (mutations.length > 0) {
				for (let mutation of mutations) {
					const mutationSentence = this.featureUtil.createMutationVariantSentence(
						mutation
					);

					if (!mutationSentence) {
						continue;
					}

					variant.setVariantSentence(mutationSentence);

					if (
						mutationSentence.action === VariantSentenceActions.APPEND ||
						mutationSentence.action === VariantSentenceActions.SEE
					) {
						const isValidInteractableElement = this.checkValidInteractableElement(
							mutation.target as HTMLElement
						);

						if (isValidInteractableElement) {
							interactableElements.push(mutation.target);
						}
					}
				}

				observer.resetMutations();
			}
		}

		this.elementInteractionGenerator.resetFilledRadioGroups();

		return variant;
	}

	private checkValidInteractableElement(elm: HTMLElement) {
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

	private getInteractableElements(element: HTMLElement): ChildNode[] {
		// valid types for interactive elements
		let elements = Array.from(element.querySelectorAll('input, select, textarea, button'));

		let interactableElements = elements.filter((elm) =>
			this.checkValidInteractableElement(elm as HTMLElement)
		);

		return interactableElements;
	}

	private getInteractableElementsIgnoringForm(element): ChildNode[] {
		let interactableElements: ChildNode[] = [];

		for (let elm of element.childNodes) {
			if (elm.nodeName !== HTMLNodeTypes.FORM) {
				if (this.checkValidInteractableElement(elm)) {
					interactableElements.push(elm);
				}

				if (elm.childNodes.length !== 0) {
					this.getInteractableElementsIgnoringForm(elm);
				}
			}
		}

		return interactableElements;
	}
}

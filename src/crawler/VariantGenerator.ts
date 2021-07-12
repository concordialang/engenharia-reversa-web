import { HTMLNodeTypes } from '../html/HTMLNodeTypes';
import { MutationObserverManager } from '../mutation-observer/MutationObserverManager';
import { ElementInteractionExecutor } from './ElementInteractionExecutor';
import { ElementInteractionGenerator } from './ElementInteractionGenerator';
import { ElementInteraction } from './ElementInteraction';
import { Variant } from '../spec-analyser/Variant';
import { FeatureUtil } from '../spec-analyser/FeatureUtil';
import { UIElement } from '../spec-analyser/UIElement';

//!!! Refatorar para utilizar algum tipo de padrão de projeto comportamental
//!!! Detalhar mais o disparamento de eventos, atualmente só está lançando "change"

// TODO: Refatorar construtor
// TODO: Refatorar classe

export class VariantGenerator {
	constructor(
		private elementInteractionExecutor: ElementInteractionExecutor,
		private elementInteractionGenerator: ElementInteractionGenerator,
		private featureUtil: FeatureUtil
	) {}

	public async generate(
		contextElement: HTMLElement,
		redirectionCallback?: (interaction: ElementInteraction<HTMLElement>) => Promise<void>,
		ignoreFormElements: boolean = false
	): Promise<Variant | null> {
		let interactableElements: ChildNode[] = ignoreFormElements
			? this.getInteractableElementsIgnoringForm(contextElement)
			: this.getInteractableElements(contextElement);

		if (interactableElements.length <= 0) {
			return null;
		}

		// add observer on form
		let observer = new MutationObserverManager(contextElement);

		// start feature analysis
		const variant = this.featureUtil.createVariant();

		for (const element of interactableElements) {
			// interacts with the element
			const interaction = this.elementInteractionGenerator.generate(<HTMLElement>element);

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

			if (!interaction) continue;

			const interactionElement = interaction.getElement();

			let uiElement: UIElement | null = null;

			// analyzes the interaction
			if (
				interactionElement instanceof HTMLInputElement ||
				interactionElement instanceof HTMLSelectElement ||
				interactionElement instanceof HTMLButtonElement
			) {
				uiElement = this.featureUtil.createUiElment(interactionElement);
			}

			if (!uiElement) {
				continue;
			}

			const variantSentence = this.featureUtil.createVariantSentence(uiElement);

			if (variantSentence !== null) {
				variant.setVariantSentence(variantSentence);
			}

			const mutations = observer.getMutations();

			if (mutations.length > 0) {
				const mutationSentences = this.featureUtil.createMutationVariantSentences(
					uiElement,
					mutations
				);

				for (let sentence of mutationSentences) {
					variant.setVariantSentence(sentence);
				}

				observer.resetMutations();
			}
		}

		observer.disconnect();

		this.elementInteractionGenerator.resetFilledRadioGroups();

		return variant;
	}

	private getInteractableElements(element: HTMLElement): ChildNode[] {
		return Array.from(element.querySelectorAll('input, select, textarea, button'));
	}

	private getInteractableElementsIgnoringForm(element): ChildNode[] {
		let interactableElements: ChildNode[] = [];

		for (let el of element.childNodes) {
			if (el.nodeName !== HTMLNodeTypes.FORM) {
				if (
					el.nodeName === HTMLNodeTypes.INPUT ||
					el.nodeName === HTMLNodeTypes.SELECT ||
					el.nodeName === HTMLNodeTypes.TEXTAREA ||
					el.nodeName === HTMLNodeTypes.BUTTON
				) {
					interactableElements.push(el);
				}

				if (el.childNodes.length !== 0) {
					this.getInteractableElementsIgnoringForm(el);
				}
			}
		}

		return interactableElements;
	}
}

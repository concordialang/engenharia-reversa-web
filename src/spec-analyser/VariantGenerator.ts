import { HTMLNodeTypes } from '../html/HTMLNodeTypes';
import { MutationObserverManager } from '../mutation-observer/MutationObserverManager';
import { ElementInteractionExecutor } from '../crawler/ElementInteractionExecutor';
import { ElementInteractionGenerator } from '../crawler/ElementInteractionGenerator';
import { ElementInteraction } from '../crawler/ElementInteraction';
import { Variant } from './Variant';
import { FeatureUtil } from './FeatureUtil';
import { UIElement } from './UIElement';
import { AnalyzedElement } from '../crawler/AnalyzedElement';
import getXPath from 'get-xpath';
import { AnalyzedElementStorage } from '../storage/AnalyzedElementStorage';
import { VariantSentence } from './VariantSentence';

export class VariantGenerator {
	constructor(
		private elementInteractionExecutor: ElementInteractionExecutor,
		private elementInteractionGenerator: ElementInteractionGenerator,
		private featureUtil: FeatureUtil,
		private analyzedElementStorage: AnalyzedElementStorage
	) {}

	public async generate(
		analysisElement: HTMLElement,
		url: URL,
		ignoreElementsInsideFeatureTags: boolean = false,
		redirectionCallback?: (interaction: ElementInteraction<HTMLElement>) => Promise<void>
	): Promise<Variant[]> {
		let observer = new MutationObserverManager(analysisElement);
		let variants: Variant[] = [];
		let variant: Variant | null;

		do {
			variant = await this.generateVariant(
				analysisElement,
				url,
				observer,
				ignoreElementsInsideFeatureTags,
				redirectionCallback
			);

			if (variant && variant.getSentences().length > 0) {
				variants.push(variant);
			}
		} while (variant && !variant.last);

		observer.disconnect();

		return variants;
	}

	public async generateVariant(
		analysisElement: HTMLElement,
		url: URL,
		observer: MutationObserverManager,
		ignoreElementsInsideFeatureTags: boolean,
		redirectionCallback?: (interaction: ElementInteraction<HTMLElement>) => Promise<void>
	): Promise<Variant | null> {
		const variant = this.featureUtil.createVariant();

		while (true) {
			let element = await this.getNextInteractableElement(
				analysisElement,
				ignoreElementsInsideFeatureTags,
				url
			);
			if (!element) {
				break;
			}

			const interaction = this.elementInteractionGenerator.generate(element as HTMLElement);
			if (!interaction) {
				await this.setAnalyzedElement(element, url);
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
				await this.setAnalyzedElement(element, url);
				continue;
			}

			const variantSentence = this.featureUtil.createVariantSentence(uiElement);
			if (!variantSentence) {
				await this.setAnalyzedElement(element, url);
				continue;
			}

			variant.setVariantSentence(variantSentence);

			let mutations: MutationRecord[] = observer.getMutations();

			if (mutations.length == 0) {
				mutations = observer.getRecords();
			}

			if (mutations.length > 0) {
				const mutationVariantSentences = this.treatMutationsSentences(mutations);
				variant.setVariantsSentences(mutationVariantSentences);
				observer.resetMutations();
			}

			await this.setAnalyzedElement(element, url);
		}

		this.elementInteractionGenerator.resetFilledRadioGroups();

		variant.last = true;
		return variant;
	}

	private async setAnalyzedElement(elm: Element, url: URL) {
		const analyzedElement = new AnalyzedElement(elm as HTMLElement, url);
		await this.analyzedElementStorage.set(analyzedElement.getId(), analyzedElement);
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

	private async getNextInteractableElement(
		analyzedElement: HTMLElement,
		ignoreElementsInsideFeatureTags: boolean,
		url
	): Promise<Element | undefined> {
		let interactableElements: Element[] = ignoreElementsInsideFeatureTags
			? this.getInteractableElementsIgnoringFeatureTags(analyzedElement)
			: this.getAllInteractableElements(analyzedElement);

		interactableElements = Array.from(interactableElements);

		let nexElm;
		for (let elm of interactableElements) {
			const xPathElement = getXPath(elm);
			const isAnalyzedElement = await this.analyzedElementStorage.isElementAnalyzed(
				xPathElement,
				url
			);

			if (!isAnalyzedElement) {
				nexElm = elm;
				break;
			}
		}

		return nexElm;
	}

	private getAllInteractableElements(element: HTMLElement): Element[] {
		// valid types for interactive elements
		let elements = Array.from(element.querySelectorAll('input, select, textarea, button'));

		let interactableElements = elements.filter((elm) =>
			this.checkValidInteractableElement(elm as HTMLElement)
		);

		return interactableElements;
	}

	private getInteractableElementsIgnoringFeatureTags(element): Element[] {
		let interactableElements: HTMLElement[] = [];

		for (let elm of element.childNodes) {
			if (elm.nodeName !== HTMLNodeTypes.FORM && elm.nodeName !== HTMLNodeTypes.TABLE) {
				if (this.checkValidInteractableElement(elm)) {
					interactableElements.push(elm);
				}

				if (elm.childNodes.length !== 0) {
					this.getInteractableElementsIgnoringFeatureTags(elm);
				}
			}
		}

		return interactableElements;
	}

	private treatMutationsSentences(mutations: MutationRecord[]): VariantSentence[] {
		let mutationSentences: VariantSentence[] = [];
		for (let mutation of mutations) {
			const mutationSentence = this.featureUtil.createMutationVariantSentence(mutation);

			if (!mutationSentence) {
				continue;
			}

			mutationSentences.push(mutationSentence);
		}

		return mutationSentences;
	}
}

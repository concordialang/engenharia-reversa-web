import { UIElement } from './UIElement';
import { VariantSentence } from './VariantSentence';
import { EditableTypes } from '../types/EditableTypes';
import { VariantSentenceActions } from '../types/VariantSentenceActions';
import { VariantSentenceType } from '../types/VariantSentenceType';
import { getInteractableElements } from '../util';
import { UIElementGenerator } from './UIElementGenerator';

export class VariantSentencesGenerator {
	constructor(private uiElementGenerator: UIElementGenerator) {}

	public gerate(element: HTMLElement, firstAnalyzedSentence: boolean): VariantSentence | null {
		const uiElement: UIElement | null = this.uiElementGenerator.createFromElement(element);
		if (!uiElement || !uiElement.getType()) {
			return null;
		}

		let action: string = '';
		switch (uiElement.getType()) {
			case EditableTypes.TEXTBOX:
				action = VariantSentenceActions.FILL;
				break;
			case EditableTypes.BUTTON:
				action = VariantSentenceActions.CLICK;
				break;
			case EditableTypes.TEXTAREA:
				action = VariantSentenceActions.FILL;
				break;
			case EditableTypes.CHECKBOX:
				action = VariantSentenceActions.CHECK;
				break;
			case EditableTypes.SELECT:
				action = VariantSentenceActions.SELECT;
				break;
			default:
				action = VariantSentenceActions.FILL;
				break;
		}

		const variantType = firstAnalyzedSentence
			? VariantSentenceType.WHEN
			: VariantSentenceType.AND;

		return new VariantSentence(variantType, action, uiElement);
	}

	public gerateGivenTypeSentence(url: URL): VariantSentence {
		return new VariantSentence(
			VariantSentenceType.GIVEN,
			VariantSentenceActions.AMON,
			undefined,
			undefined,
			url
		);
	}

	public gerateThenTypeSentence(featureName: string): VariantSentence {
		return new VariantSentence(
			VariantSentenceType.THEN,
			VariantSentenceActions.HAVE,
			undefined,
			undefined,
			undefined,
			featureName.toLocaleLowerCase()
		);
	}

	public gerateFromMutations(mutation: MutationRecord): VariantSentence[] | null {
		let sentences: VariantSentence[] = [];

		if (mutation.type === 'attributes') {
			if (mutation.attributeName === 'style') {
				sentences = this.buildAttrStyleSentence(mutation);
			} else if (mutation.attributeName === 'value') {
				sentences = this.buildAttrValueSentence(mutation);
			} else if (mutation.attributeName === 'disabled') {
				sentences = this.buildAttrDisabledSentence(mutation);
			} else if (mutation.attributeName === 'readonly') {
				sentences = this.buildAttrReadOnlySentence(mutation);
			}
		} else if (mutation.type === 'childList') {
			sentences = this.buildChildListSentence(mutation);
		}

		return sentences.length >= 1 ? sentences : null;
	}

	private buildAttrStyleSentence(mutation): VariantSentence[] {
		let sentences: VariantSentence[] = [];

		let property = mutation.target.style[0];
		const node = mutation.target;

		if (property && node && (property === 'display' || property === 'visibility')) {
			let value = mutation.target.style.display
				? mutation.target.style.display
				: mutation.target.style.visibility;

			if (value != mutation.oldValue) {
				if (
					(value === 'none' && property == 'display') ||
					(value === 'hidden' && property == 'visibility')
				) {
					sentences = this.createSentencesForMutations(
						node,
						VariantSentenceType.AND,
						VariantSentenceActions.NOTSEE,
						[{ property: property, value: value }]
					);
				} else {
					sentences = this.createSentencesForMutations(
						node,
						VariantSentenceType.AND,
						VariantSentenceActions.SEE,
						[{ property: property, value: value }]
					);
				}
			}
		}

		return sentences;
	}

	private buildChildListSentence(mutation): VariantSentence[] {
		let sentences: VariantSentence[] = [];

		let addedNodes = Object.values(mutation.addedNodes);
		let removedNodes = Object.values(mutation.removedNodes);

		if (addedNodes && addedNodes.length > 0) {
			const node: any = addedNodes[0];

			sentences = this.createSentencesForMutations(
				node,
				VariantSentenceType.AND,
				VariantSentenceActions.APPEND
			);
		} else if (removedNodes && removedNodes.length > 0) {
			const node: any = removedNodes[0];

			sentences = this.createSentencesForMutations(
				node,
				VariantSentenceType.AND,
				VariantSentenceActions.REMOVE
			);
		}

		return sentences;
	}

	private buildAttrValueSentence(mutation): VariantSentence[] {
		let sentences: VariantSentence[] = [];

		let node = mutation.target;

		if (node && node.value !== mutation.oldValue) {
			if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
				sentences = this.createSentencesForMutations(
					node,
					VariantSentenceType.AND,
					VariantSentenceActions.FILL,
					[{ property: 'value', value: node.value }]
				);
			}

			if (node instanceof HTMLSelectElement) {
				sentences = this.createSentencesForMutations(
					node,
					VariantSentenceType.AND,
					VariantSentenceActions.SELECT,
					[{ property: 'value', value: node.value }]
				);
			}
		}

		return sentences;
	}

	private buildAttrDisabledSentence(mutation): VariantSentence[] {
		let sentences: VariantSentence[] = [];

		const node = mutation.target;
		// TODO - analisar
		const oldValue = mutation.oldValue == 'true' || mutation.oldValue === true ? true : false;

		if (node && oldValue != node.disabled) {
			sentences = this.createSentencesForMutations(
				node,
				VariantSentenceType.AND,
				VariantSentenceActions.SEE,
				[{ property: 'disabled', value: node.disabled }]
			);
		}

		return sentences;
	}

	private buildAttrReadOnlySentence(mutation): VariantSentence[] {
		let sentences: VariantSentence[] = [];

		const node = mutation.target;
		const oldValue = mutation.oldValue == 'true' || mutation.oldValue ? true : false;

		if (node && oldValue != node.disabled) {
			sentences = this.createSentencesForMutations(
				node,
				VariantSentenceType.AND,
				VariantSentenceActions.SEE,
				[{ property: 'readonly', value: node.readOnly }]
			);
		}

		return sentences;
	}

	private createSentencesForMutations(
		element: HTMLElement,
		type: VariantSentenceType,
		action: VariantSentenceActions,
		attr: Array<{ property: string; value: string }> = []
	): VariantSentence[] {
		let sentences: VariantSentence[] = [];

		let uiElement: UIElement | null = this.uiElementGenerator.createFromElement(element);
		if (uiElement) {
			sentences.push(new VariantSentence(type, action, uiElement, attr));
		} else {
			const interactableElements = getInteractableElements(element);

			for (let interacElm of interactableElements) {
				uiElement = this.uiElementGenerator.createFromElement(interacElm as HTMLElement);
				if (uiElement) {
					sentences.push(new VariantSentence(type, action, uiElement, attr));
				}
			}
		}

		return sentences;
	}
}

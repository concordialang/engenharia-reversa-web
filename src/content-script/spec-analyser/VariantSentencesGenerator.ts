import { UIElement } from './UIElement';
import { VariantSentence } from './VariantSentence';
import { VariantSentenceActions } from '../enums/VariantSentenceActions';
import { VariantSentenceType } from '../enums/VariantSentenceType';
import { getValidUiElementsNodes } from '../util';
import { UIElementGenerator } from './UIElementGenerator';
import { UiElementsTypes } from '../enums/UiElementsTypes';

export class VariantSentencesGenerator {
	constructor(private uiElementGenerator: UIElementGenerator) {}

	public gerate(element: HTMLElement, whenSentenceCreated: boolean): VariantSentence | null {
		const uiElement: UIElement | null = this.uiElementGenerator.createFromElement(element);
		if (!uiElement) {
			return null;
		}

		let action: string = '';
		switch (uiElement.getType()) {
			case UiElementsTypes.TEXTBOX:
				action = VariantSentenceActions.FILL;
				break;
			case UiElementsTypes.TEXTAREA:
				action = VariantSentenceActions.FILL;
				break;
			case UiElementsTypes.CHECKBOX:
				action = VariantSentenceActions.CHECK;
				break;
			case UiElementsTypes.SELECT:
				action = VariantSentenceActions.SELECT;
				break;
			case UiElementsTypes.RADIO:
				action = VariantSentenceActions.SELECT;
				break;
			case UiElementsTypes.BUTTON:
				action = VariantSentenceActions.CLICK;
				break;
			default:
				action = VariantSentenceActions.CLICK;
				break;
		}

		const variantType = whenSentenceCreated
			? VariantSentenceType.AND
			: VariantSentenceType.WHEN;

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

	public gerateThenTypeSentence(
		featureName: string,
		lastButtonInteracted: HTMLButtonElement | HTMLInputElement | null
	): VariantSentence {
		let statePostCondition = featureName.toLocaleLowerCase();

		if (lastButtonInteracted !== null) {
			let textButton = '';

			if (lastButtonInteracted.innerText) {
				textButton = lastButtonInteracted.innerText;
			} else if (
				lastButtonInteracted instanceof HTMLInputElement &&
				lastButtonInteracted.value
			) {
				textButton = lastButtonInteracted.value;
			}

			statePostCondition += textButton != '' ? ' | ' + textButton.toLocaleLowerCase() : '';
		}

		return new VariantSentence(
			VariantSentenceType.THEN,
			VariantSentenceActions.HAVE,
			undefined,
			undefined,
			undefined,
			statePostCondition
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

			if (value !== mutation.oldValue) {
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

		let oldValue = mutation.oldValue;
		if (mutation.oldValue === 'true') {
			oldValue = true;
		} else if (mutation.oldValue === 'false') {
			oldValue = false;
		}

		if (node && oldValue !== node.disabled) {
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

		let oldValue = mutation.oldValue;
		if (mutation.oldValue === 'true') {
			oldValue = true;
		} else if (mutation.oldValue === 'false') {
			oldValue = false;
		}

		if (node && oldValue !== node.disabled) {
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
			const validsUiElmNodes = getValidUiElementsNodes(element);

			for (let node of validsUiElmNodes) {
				uiElement = this.uiElementGenerator.createFromElement(node as HTMLElement);
				if (uiElement) {
					sentences.push(new VariantSentence(type, action, uiElement, attr));
				}
			}
		}

		return sentences;
	}
}

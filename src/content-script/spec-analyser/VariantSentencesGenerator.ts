import { UIElement } from './UIElement';
import { VariantSentence } from './VariantSentence';
import { VariantSentenceActions } from '../enums/VariantSentenceActions';
import { VariantSentenceType } from '../enums/VariantSentenceType';
import { getValidUiElementsNodes, isIterable, isVisible } from '../util';
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
			case UiElementsTypes.TextBox:
				action = VariantSentenceActions.FILL;
				break;
			case UiElementsTypes.TextArea:
				action = VariantSentenceActions.FILL;
				break;
			case UiElementsTypes.Checkbox:
				action = VariantSentenceActions.CHECK;
				break;
			case UiElementsTypes.Select:
				action = VariantSentenceActions.SELECT;
				break;
			case UiElementsTypes.Radio:
				action = VariantSentenceActions.CLICK;
				break;
			case UiElementsTypes.Button:
				action = VariantSentenceActions.CLICK;
				break;
			case UiElementsTypes.Link:
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

	public gerateGivenTypeSentence(): VariantSentence {
		return new VariantSentence(
			VariantSentenceType.GIVEN,
			VariantSentenceActions.AMON,
			undefined,
			undefined,
		);
	}

	public gerateThenTypeSentence(
		featureName: string,
		lastClicableInteracted: HTMLButtonElement | HTMLInputElement | HTMLAnchorElement | null
	): VariantSentence {
		let statePostCondition = featureName.toLocaleLowerCase();

		return new VariantSentence(
			VariantSentenceType.THEN,
			VariantSentenceActions.HAVE,
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
			} else if (mutation.attributeName === 'hidden') {
				sentences = this.buildAttrHiddenSentence(mutation);
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
						[{ property: property, value: value }],
						false
					);
				} else {
					sentences = this.createSentencesForMutations(
						node,
						VariantSentenceType.AND,
						VariantSentenceActions.SEE,
						[{ property: property, value: value }],
					);
				}
			}
		}

		return sentences;
	}

	private buildChildListSentence(mutation): VariantSentence[] {
		let sentences: VariantSentence[] = [];

		let removedNodes = Object.values(mutation.removedNodes);
		let addedNodes = Object.values(mutation.addedNodes);

		if (removedNodes && removedNodes.length > 0) {
			for(let node of removedNodes){
				let nodeSentences = this.createSentencesForMutations(
					node as any,
					VariantSentenceType.AND,
					VariantSentenceActions.REMOVE,
				)

				sentences = sentences.concat(nodeSentences);
			}
		}

		if (addedNodes && addedNodes.length > 0) {
			for(let node of addedNodes){
				let nodeSentences = this.createSentencesForMutations(
					node as any,
					VariantSentenceType.AND,
					VariantSentenceActions.APPEND,
				)

				sentences = sentences.concat(nodeSentences);
			}
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

	private buildAttrHiddenSentence(mutation): VariantSentence[] {
		let sentences: VariantSentence[] = [];

		const node = mutation.target;

		if (node) {
			let hidden = node.hidden;

			let action = '';

			if(hidden === true){
				action = VariantSentenceActions.NOTSEE;
			}
			else {
				action = VariantSentenceActions.SEE;
			}

			sentences = this.createSentencesForMutations(
				node,
				VariantSentenceType.AND,
				action,
				[{ property: 'hidden', value: node.hidden }],
				false
			);
		}

		return sentences;
	}

	private createSentencesForMutations(
		element: HTMLElement,
		type: VariantSentenceType,
		action: string,
		attr: Array<{ property: string; value: string }> = [],
		checkVisibility = true
	): VariantSentence[] {
		let sentences: VariantSentence[] = [];

		let uiElement: UIElement | null = null;

		if(checkVisibility){
			uiElement = 
				!(element instanceof Text) && isVisible(element) 
					? this.uiElementGenerator.createFromElement(element)
					: null
		}
		else {
			uiElement = this.uiElementGenerator.createFromElement(element);
		}

		if (uiElement) {
			sentences.push(new VariantSentence(type, action, uiElement, attr));
		} else {
			const validsUiElmNodes = getValidUiElementsNodes(element);

			if(validsUiElmNodes){
				if(isIterable(validsUiElmNodes)){
					for (let node of validsUiElmNodes) {
						let elm = node as HTMLElement;

						if(isVisible(elm)){
							uiElement = this.uiElementGenerator.createFromElement(elm);
							if (uiElement) {
								sentences.push(new VariantSentence(type, action, uiElement, attr));
							}
						}
					}
				} else {
					console.error("validsUiElmNodes is not iterable for type " + validsUiElmNodes.constructor.name);
					return [];
				}
			} 
			
		}

		return sentences;
	}
}

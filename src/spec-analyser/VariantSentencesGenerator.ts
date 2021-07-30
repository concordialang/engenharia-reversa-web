import { UIElement } from './UIElement';
import { VariantSentence } from './VariantSentence';
import { EditableTypes } from '../types/EditableTypes';
import { VariantSentenceActions } from '../types/VariantSentenceActions';
import { VariantSentenceType } from '../types/VariantSentenceType';
import getXPath from 'get-xpath';

export class VariantSentencesGenerator {
	public generateVariantSentenceFromUIElement(uiElment: UIElement): VariantSentence | null {
		let target: string = uiElment.getName();
		let type: string = uiElment.getType();

		if (!target || !type) {
			return null;
		}

		let action: string = '';
		switch (type) {
			case EditableTypes.TEXTBOX:
				action = VariantSentenceActions.FILL;
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

		return new VariantSentence(
			VariantSentenceType.WHEN,
			action,
			['{' + target + '}'],
			undefined,
			uiElment
		);
	}

	public generateVariantSentenceFromMutations(mutation): VariantSentence | null {
		let sentence: VariantSentence | null = null;

		if (mutation.type === 'attributes') {
			if (mutation.attributeName === 'style') {
				sentence = this.buildAttibutesStyleSentence(mutation);
			} else if (mutation.attributeName === 'value') {
				sentence = this.buildAttibutesValueSentence(mutation);
			}
		} else if (mutation.type === 'childList') {
			sentence = this.buildChildListSentence(mutation);
		}

		return sentence;
	}

	private buildAttibutesStyleSentence(mutation): VariantSentence | null {
		let sentence: VariantSentence | null = null;

		let property = mutation.target.style[0];
		let xPathNode = getXPath(mutation.target);

		if (property === 'display') {
			let value = mutation.target.style.display;

			if (value === 'none') {
				sentence = new VariantSentence(
					VariantSentenceType.AND,
					VariantSentenceActions.NOTSEE,
					['{' + xPathNode + '}'],
					[{ property: property, value: value }]
				);
			} else if (value === 'block' || value === 'inline-block' || value === 'inline') {
				sentence = new VariantSentence(
					VariantSentenceType.AND,
					VariantSentenceActions.SEE,
					['{' + xPathNode + '}'],
					[{ property: property, value: value }]
				);
			}
		}

		return sentence;
	}

	private buildChildListSentence(mutation): VariantSentence | null {
		let sentence: VariantSentence | null = null;

		let addedNodes = Object.values(mutation.addedNodes);
		let removedNodes = Object.values(mutation.removedNodes);

		if (addedNodes.length > 0) {
			const node: any = addedNodes[0];
			let xPathNode = getXPath(node);

			if (node) {
				sentence = new VariantSentence(
					VariantSentenceType.AND,
					VariantSentenceActions.APPEND,
					['{' + xPathNode + '}']
				);
			}
		} else if (removedNodes.length > 0) {
			const node: any = removedNodes[0];
			let xPathNode = getXPath(node);

			if (node) {
				sentence = new VariantSentence(
					VariantSentenceType.AND,
					VariantSentenceActions.REMOVE,
					['{' + xPathNode + '}']
				);
			}
		}

		return sentence;
	}

	private buildAttibutesValueSentence(mutation): VariantSentence | null {
		let sentence: VariantSentence | null = null;

		let node = mutation.target;
		let xPathNode = getXPath(mutation.target);

		if (!node || !node.value) {
			return sentence;
		}

		if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
			sentence = new VariantSentence(
				VariantSentenceType.AND,
				VariantSentenceActions.FILL,
				['{' + xPathNode + '}'],
				[{ property: 'value', value: node.value }]
			);
		}

		if (node instanceof HTMLSelectElement) {
			sentence = new VariantSentence(
				VariantSentenceType.AND,
				VariantSentenceActions.SELECT,
				['{' + xPathNode + '}'],
				[{ property: 'value', value: node.value }]
			);
		}

		return sentence;
	}
}

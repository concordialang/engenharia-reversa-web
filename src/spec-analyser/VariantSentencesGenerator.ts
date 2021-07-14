import { UIElement } from './UIElement';
import { VariantSentence } from './VariantSentence';
import { EditableTypes } from '../types/EditableTypes';
import { VariantSentenceActions } from '../types/VariantSentenceActions';
import { VariantSentenceType } from '../types/VariantSentenceType';

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

		return new VariantSentence(VariantSentenceType.WHEN, action, ['{' + target + '}']);
	}

	public generateVariantSentenceFromMutations(uiElment, mutations) {
		let sentences: VariantSentence[] = [];

		for (let mutation of mutations) {
			if (mutation.type === 'attributes') {
				if (mutation.attributeName === 'style') {
					this.buildStyleSentence(sentences, mutation);
				}
			} else if (mutation.type === 'childList') {
				this.buildChildListSentence(sentences, mutation);
			}
		}

		return sentences;
	}

	private buildStyleSentence(sentences, mutation) {
		let property = mutation.target.style[0];

		if (property === 'display') {
			let value = mutation.target.style.display;

			if (value === 'none') {
				sentences.push(
					new VariantSentence(VariantSentenceType.AND, VariantSentenceActions.NOTSEE, [
						'{' + mutation.target.id + '}',
					])
				);
			} else if (value === 'block' || value === 'inline-block' || value === 'inline') {
				sentences.push(
					new VariantSentence(
						VariantSentenceType.AND,
						VariantSentenceActions.SEE,
						['{' + mutation.target.id + '}'],
						[property + ':' + value]
					)
				);
			}
		}
	}

	private buildChildListSentence(sentences, mutation) {
		let addedNodes = Object.values(mutation.addedNodes);
		let removedNodes = Object.values(mutation.removedNodes);

		if (addedNodes.length > 0) {
			const node: any = addedNodes[0];

			if (node) {
				sentences.push(
					new VariantSentence(VariantSentenceType.AND, VariantSentenceActions.APPEND, [
						'{' + node.id + '}',
					])
				);
			}
		}

		if (removedNodes.length > 0) {
			const node: any = removedNodes[0];

			if (node) {
				sentences.push(
					new VariantSentence(VariantSentenceType.AND, VariantSentenceActions.REMOVE, [
						'{' + node.id + '}',
					])
				);
			}
		}
	}
}

import { UIElement } from '../feature/UIElement';
import { VariantSentence } from '../feature/VariantSentence';
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

	public generateVariantSentencesFromMutations(uiElment: UIElement, mutations) {
		let sentences: VariantSentence[] = [];

		for (let mutation of mutations) {
			if (mutation.type === 'attributes') {
				if (mutation.attributeName === 'style') {
					if (mutation.oldValue !== null) {
						let oldValueArray = mutation.oldValue.split(':');
						let attribute = oldValueArray[0];
						let oldValue = oldValueArray[1].replace(';', '').replace(' ', '');

						if (attribute === 'display') {
							if (oldValue === 'none' && mutation.target.style.display === 'block') {
								console.log('E eu vejo o elemento {#' + mutation.target.id + '}');
								//gerar nome para mutacao
								sentences.push(
									new VariantSentence(
										VariantSentenceType.WHEN,
										VariantSentenceActions.SEE,
										['{' + mutation.target.id + '}']
									)
								);
							}

							if (oldValue === 'block' && mutation.target.style.display === 'none') {
								console.log(
									'E eu não vejo o elemento {#' + mutation.target.id + '}'
								);
								sentences.push(
									new VariantSentence(
										VariantSentenceType.WHEN,
										VariantSentenceActions.NOTSEE,
										['{' + mutation.target.id + '}']
									)
								);
							}
						}
					}
				}
			}
		}

		return sentences;
	}
}

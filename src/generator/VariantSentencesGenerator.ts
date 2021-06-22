import { UIElement } from '../feature/UIElement';
import { VariantSentence } from '../feature/VariantSentence';
import { EditableTypes } from '../types/EditableTypes';
import { VariantSentenceActions } from '../types/VariantSentenceActions';
import { VariantSentenceType } from '../types/VariantSentenceType';

export class VariantSentencesGenerator {
	// TODO: Refatorar
	public generateVariantSentenceFromUIElement(uiElment: UIElement): VariantSentence | null {
		let type: string = '';
		let target: string | null = null;
		let editable: boolean | null = null;
		let required: boolean = false;

		for (let property of uiElment.getProperties()) {
			switch (property.getName()) {
				case 'type':
					type = property.getValue();
					break;
				case 'editabled':
					editable = property.getValue();
					break;
				case 'id':
					target = property.getValue();
					break;
				case 'required':
					required = property.getValue();
					break;
			}
		}

		if (!target || !editable || !type) {
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

		let sentence = new VariantSentence(VariantSentenceType.WHEN, action, ['{' + target + '}']);

		return sentence;
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

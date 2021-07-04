import { FeatureUtil } from '../../src/spec-analyser/FeatureUtil';
import { UIElement } from '../../src/spec-analyser/UIElement';
import { VariantSentence } from '../../src/spec-analyser/VariantSentence';
import { VariantSentenceActions } from '../../src/types/VariantSentenceActions';
import { VariantSentenceType } from '../../src/types/VariantSentenceType';

describe('VariantSentencesGenerator', () => {
	const featureutil = new FeatureUtil();
	const doc = document.implementation.createHTMLDocument();

	it('generate variant setence for input with type when', () => {
		doc.body.innerHTML = `<div>
                <label for="input">First Name:</label>
                <input type="text" id="input" name="input" />
            </div>`;

		let input = doc.querySelector('input');
		const uiElm = featureutil.createUiElment(input as HTMLInputElement);
		if (uiElm) {
			let variantSentence = featureutil.createVariantSentence(uiElm);

			if (variantSentence) {
				expect(variantSentence.action).toBe(VariantSentenceActions.FILL);
				expect(variantSentence.targets).toHaveLength(1);
				expect(variantSentence.targets[0]).toBe('{Input}');
				expect(variantSentence.type).toBe(VariantSentenceType.WHEN);
			}
		}
	});

	it('generate variant setence for textarea with type when', () => {
		doc.body.innerHTML = `<div>
                <label for="textArea">First Name:</label>
                <textarea type="text" id="textArea" name="textArea"></textarea>
            </div>`;

		let textArea = doc.querySelector('textarea');
		const uiElm = featureutil.createUiElment(textArea as HTMLTextAreaElement);
		if (uiElm) {
			let variantSentence = featureutil.createVariantSentence(uiElm);

			if (variantSentence) {
				expect(variantSentence.action).toBe(VariantSentenceActions.FILL);
				expect(variantSentence.targets).toHaveLength(1);
				expect(variantSentence.targets[0]).toBe('{TextArea}');
				expect(variantSentence.type).toBe(VariantSentenceType.WHEN);
			}
		}
	});

	it('generate variant setence for select with type when', () => {
		doc.body.innerHTML = `<div>
                <label for="inputText">First Name:</label>
                <select type="text" id="select" name="select">
                    <option>Option 1</option>
                    <option>Option 2</option>
                    <option>Option 3</option>
                </select>
            </div>`;

		let select = doc.querySelector('select');
		const uiElm = featureutil.createUiElment(select as HTMLSelectElement);
		if (uiElm) {
			let variantSentence = featureutil.createVariantSentence(uiElm);

			if (variantSentence) {
				expect(variantSentence.action).toBe(VariantSentenceActions.SELECT);
				expect(variantSentence.targets).toHaveLength(1);
				expect(variantSentence.targets[0]).toBe('{Select}');
				expect(variantSentence.type).toBe(VariantSentenceType.WHEN);
			}
		}
	});
});

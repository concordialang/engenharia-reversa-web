import { FeatureUtil } from '../../src/spec-analyser/FeatureUtil';
import { VariantSentenceActions } from '../../src/types/VariantSentenceActions';
import { VariantSentenceType } from '../../src/types/VariantSentenceType';
import clearElement from '../../src/util';

describe('VariantSentencesGenerator', () => {
	const featureutil = new FeatureUtil();

	afterEach(() => {
		clearElement(document.body);
	});

	it('generate variant setence for input', () => {
		document.body.innerHTML = `<div>
                <label for="input">First Name:</label>
                <input type="text" id="input" name="input" />
            </div>`;

		let input = document.querySelector('input');

		const uiElm: any = featureutil.createUiElment(input as HTMLInputElement);

		if (!uiElm) {
			throw new Error('UiElm is empty');
		}

		const variantSentence: any = featureutil.createVariantSentence(uiElm);

		if (!variantSentence) {
			throw new Error('variantSentence is empty');
		}

		expect(variantSentence.action).toBe(VariantSentenceActions.FILL);
		expect(variantSentence.targets).toHaveLength(1);
		expect(variantSentence.targets[0]).toBe('{Input}');
		expect(variantSentence.type).toBe(VariantSentenceType.WHEN);
	});

	it('generate variant setence for textarea', () => {
		document.body.innerHTML = `<div>
                <label for="textArea">First Name:</label>
                <textarea type="text" id="textArea" name="textArea"></textarea>
            </div>`;

		let textArea = document.querySelector('textarea');

		const uiElm: any = featureutil.createUiElment(textArea as HTMLTextAreaElement);

		if (!uiElm) {
			throw new Error('UiElm is empty');
		}

		const variantSentence: any = featureutil.createVariantSentence(uiElm);

		if (!variantSentence) {
			throw new Error('variantSentence is empty');
		}

		expect(variantSentence.action).toBe(VariantSentenceActions.FILL);
		expect(variantSentence.targets).toHaveLength(1);
		expect(variantSentence.targets[0]).toBe('{TextArea}');
		expect(variantSentence.type).toBe(VariantSentenceType.WHEN);
	});

	it('generate variant setence for select', () => {
		document.body.innerHTML = `<div>
                <label for="inputText">First Name:</label>
                <select type="text" id="select" name="select">
                    <option>Option 1</option>
                    <option>Option 2</option>
                    <option>Option 3</option>
                </select>
            </div>`;

		let select = document.querySelector('select');

		const uiElm: any = featureutil.createUiElment(select as HTMLSelectElement);

		if (!uiElm) {
			throw new Error('UiElm is empty');
		}

		const variantSentence: any = featureutil.createVariantSentence(uiElm);

		if (!variantSentence) {
			throw new Error('variantSentence is empty');
		}

		expect(variantSentence.action).toBe(VariantSentenceActions.SELECT);
		expect(variantSentence.targets).toHaveLength(1);
		expect(variantSentence.targets[0]).toBe('{Select}');
		expect(variantSentence.type).toBe(VariantSentenceType.WHEN);
	});
});

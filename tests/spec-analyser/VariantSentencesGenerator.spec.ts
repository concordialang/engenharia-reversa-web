import { FeatureUtil } from '../../src/spec-analyser/FeatureUtil';
import { UIElement } from '../../src/spec-analyser/UIElement';
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
		if (!input) {
			throw new Error('input is empty');
		}

		const variantSentence: any = featureutil.createVariantSentence(input);
		if (!variantSentence) {
			throw new Error('variantSentence is empty');
		}

		expect(variantSentence.action).toBe(VariantSentenceActions.FILL);
		expect(variantSentence.targets).toHaveLength(1);
		expect(variantSentence.type).toBe(VariantSentenceType.WHEN);
		expect(variantSentence.uiElement).toBeInstanceOf(UIElement);
		expect(variantSentence.uiElement.getName()).toBe('Input');
		let teste = 1;
	});

	it('generate variant setence for textarea', () => {
		document.body.innerHTML = `<div>
                <label for="textArea">First Name:</label>
                <textarea type="text" id="textArea" name="textArea"></textarea>
            </div>`;

		let textArea = document.querySelector('textarea');
		if (!textArea) {
			throw new Error('text area is empty');
		}

		const variantSentence: any = featureutil.createVariantSentence(textArea);
		if (!variantSentence) {
			throw new Error('variantSentence is empty');
		}

		expect(variantSentence.action).toBe(VariantSentenceActions.FILL);
		expect(variantSentence.targets).toHaveLength(1);
		expect(variantSentence.type).toBe(VariantSentenceType.WHEN);
		expect(variantSentence.uiElement).toBeInstanceOf(UIElement);
		expect(variantSentence.uiElement.getName()).toBe('TextArea');
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
		if (!select) {
			throw new Error('select is empty');
		}

		const variantSentence: any = featureutil.createVariantSentence(select);
		if (!variantSentence) {
			throw new Error('variantSentence is empty');
		}

		expect(variantSentence.action).toBe(VariantSentenceActions.SELECT);
		expect(variantSentence.targets).toHaveLength(1);
		expect(variantSentence.type).toBe(VariantSentenceType.WHEN);
		expect(variantSentence.uiElement).toBeInstanceOf(UIElement);
		expect(variantSentence.uiElement.getName()).toBe('Select');
	});
});

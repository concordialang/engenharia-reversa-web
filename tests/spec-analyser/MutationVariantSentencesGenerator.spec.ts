import { FeatureUtil } from '../../src/spec-analyser/FeatureUtil';
import { MutationObserverManager } from '../../src/mutation-observer/MutationObserverManager';
import { VariantSentenceActions } from '../../src/types/VariantSentenceActions';
import { VariantSentenceType } from '../../src/types/VariantSentenceType';
import { VariantSentence } from '../../src/spec-analyser/VariantSentence';
import clearElement from '../../src/util';
import { VariantSentencesGenerator } from '../../src/spec-analyser/VariantSentencesGenerator';
import { UIElementGenerator } from '../../src/spec-analyser/UIElementGenerator';

describe('MutationVariantSentencesGenerator', () => {
	const uiElementGenerator = new UIElementGenerator();
	const variantSentencesGenerator = new VariantSentencesGenerator(uiElementGenerator);
	const featureutil = new FeatureUtil(variantSentencesGenerator);
	let observer: MutationObserverManager;

	beforeEach(() => {
		document.body.innerHTML = `<div id="divFoo">
                <input type="text" id="inputFoo" name="inputFoo"">
            </div>
			
			<div id="divFoo2">
				<select id="selectFoo">
					<option value="1">test1</option>
					<option value="2">test2</option>
					<option value="3">test3</option>
				</select>
            </div>

			<div id="divFoo3">
				<button type='button' id='btnFoo' name='btnFoo'><button>
            </div>

			<div id="divFoo4">
				<input type="checkbox" id='chkFoo' name="chkFoo">
			</div>
			
			<div id="divXpto">
                <input type="text" id="xpto" name="xpto">
            </div>`;
	});

	afterEach(() => {
		clearElement(document.body);
		observer.disconnect();
	});

	function checkMutationSentences(mutationSentences: VariantSentence[], data: any) {
		for (let i in mutationSentences) {
			const mutationSentence = mutationSentences[i];

			expect(mutationSentence).toBeInstanceOf(VariantSentence);
			expect(mutationSentence.action).toBe(data.action);
			expect(mutationSentence.type).toBe(data.type);

			if (mutationSentence.uiElement) {
				expect(mutationSentence.uiElement.getName()).toBe(data.uiElmName[i]);
			} else {
				throw new Error('uiElement is invalid');
			}

			if (mutationSentence.attributtes && mutationSentence.attributtes.length > 0) {
				expect(mutationSentence.attributtes[0]).toEqual({
					property: data.attributtes.property,
					value: data.attributtes.value,
				});
			}
		}
	}

	it('generate mutation variant sentence of type attribute style display none', () => {
		observer = new MutationObserverManager(document.body);
		let elm = document.getElementById('inputFoo') as HTMLInputElement;
		elm.setAttribute('style', 'display: none;');

		let mutations = observer.getRecords();

		expect(mutations).toHaveLength(1);

		const mutationSentences:
			| VariantSentence[]
			| null = featureutil.createMutationVariantSentences(mutations[0]);

		if (!mutationSentences) {
			throw new Error('mutationSentences is invalid');
		}

		expect(mutationSentences).toHaveLength(1);

		const data = {
			action: VariantSentenceActions.NOTSEE,
			type: VariantSentenceType.AND,
			uiElmName: ['InputFoo'],
			attributtes: { property: 'display', value: 'none' },
		};

		checkMutationSentences(mutationSentences, data);
	});

	it('generate mutation variant sentence of type attribute style visibility hidden', () => {
		observer = new MutationObserverManager(document.body);
		let elm = document.getElementById('inputFoo') as HTMLInputElement;
		elm.setAttribute('style', 'visibility: hidden;');

		let mutations = observer.getRecords();

		expect(mutations).toHaveLength(1);

		const mutationSentences:
			| VariantSentence[]
			| null = featureutil.createMutationVariantSentences(mutations[0]);

		if (!mutationSentences) {
			throw new Error('mutationSentences is invalid');
		}

		expect(mutationSentences).toHaveLength(1);

		const data = {
			action: VariantSentenceActions.NOTSEE,
			type: VariantSentenceType.AND,
			uiElmName: ['InputFoo'],
			attributtes: { property: 'visibility', value: 'hidden' },
		};

		checkMutationSentences(mutationSentences, data);
	});

	it('generate mutation variant sentence of type attribute style display block', () => {
		observer = new MutationObserverManager(document.body);
		let elm = document.getElementById('inputFoo') as HTMLInputElement;
		elm.setAttribute('style', 'display: block;');

		let mutations = observer.getRecords();

		expect(mutations).toHaveLength(1);

		const mutationSentences:
			| VariantSentence[]
			| null = featureutil.createMutationVariantSentences(mutations[0]);

		if (!mutationSentences) {
			throw new Error('mutationSentences is invalid');
		}

		expect(mutationSentences).toHaveLength(1);

		const data = {
			action: VariantSentenceActions.SEE,
			type: VariantSentenceType.AND,
			uiElmName: ['InputFoo'],
			attributtes: { property: 'display', value: 'block' },
		};

		checkMutationSentences(mutationSentences, data);
	});

	it('generate mutation variant sentence of removed element', () => {
		observer = new MutationObserverManager(document.body);
		let elm = document.getElementById('divXpto') as HTMLDivElement;
		elm.remove();

		let mutations = observer.getRecords();

		expect(mutations).toHaveLength(1);

		const mutationSentences:
			| VariantSentence[]
			| null = featureutil.createMutationVariantSentences(mutations[0]);

		if (!mutationSentences) {
			throw new Error('mutationSentences is invalid');
		}

		expect(mutationSentences).toHaveLength(1);

		const data = {
			action: VariantSentenceActions.REMOVE,
			type: VariantSentenceType.AND,
			uiElmName: ['Xpto'],
		};

		checkMutationSentences(mutationSentences, data);
	});

	it('generate mutation variant sentence of append element', () => {
		let elm = document.getElementById('divXpto') as HTMLDivElement;
		let div = document.createElement('div');
		div.setAttribute('id', 'divXpto2');

		let btn = document.createElement('button');
		btn.setAttribute('id', 'btnXpto');

		let input = document.createElement('input');
		input.setAttribute('id', 'inputXptoTest');

		div.appendChild(input);
		div.appendChild(btn);

		observer = new MutationObserverManager(document.body);

		elm.appendChild(div);

		let mutations = observer.getRecords();

		expect(mutations).toHaveLength(1);

		const mutationSentences:
			| VariantSentence[]
			| null = featureutil.createMutationVariantSentences(mutations[0]);

		if (!mutationSentences) {
			throw new Error('mutationSentences is invalid');
		}

		expect(mutationSentences).toHaveLength(2);

		const data = {
			action: VariantSentenceActions.APPEND,
			type: VariantSentenceType.AND,
			uiElmName: ['INPUTinputXptoTest', 'ButtonbtnXpto'],
		};

		checkMutationSentences(mutationSentences, data);
	});

	it('generate mutation variant sentence for value assignment', () => {
		observer = new MutationObserverManager(document.body);
		let elm = document.getElementById('inputFoo') as HTMLInputElement;
		elm.setAttribute('value', 'Test');

		let mutations = observer.getRecords();

		expect(mutations).toHaveLength(1);

		const mutationSentences:
			| VariantSentence[]
			| null = featureutil.createMutationVariantSentences(mutations[0]);

		if (!mutationSentences) {
			throw new Error('mutationSentences is invalid');
		}

		expect(mutationSentences).toHaveLength(1);

		const data = {
			action: VariantSentenceActions.FILL,
			type: VariantSentenceType.AND,
			uiElmName: ['InputFoo'],
			attributtes: { property: 'value', value: 'Test' },
		};

		checkMutationSentences(mutationSentences, data);
	});
});

import { FeatureUtil } from '../../src/spec-analyser/FeatureUtil';
import { MutationObserverManager } from '../../src/mutation-observer/MutationObserverManager';
import { VariantSentenceActions } from '../../src/types/VariantSentenceActions';
import { VariantSentenceType } from '../../src/types/VariantSentenceType';
import { VariantSentence } from '../../src/spec-analyser/VariantSentence';
import clearElement from '../../src/util';

describe('MutationVariantSentencesGenerator', () => {
	const featureutil = new FeatureUtil();
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

		observer = new MutationObserverManager(document.body);
	});

	afterEach(() => {
		clearElement(document.body);
		observer.disconnect();
	});

	it('generate mutation variant sentence of type attribute style display none', () => {
		let elm = document.getElementById('inputFoo') as HTMLInputElement;
		elm.setAttribute('style', 'display: none;');

		let mutations = observer.getRecords();

		expect(mutations).toHaveLength(1);

		const mutationSentence: any = featureutil.createMutationVariantSentence(mutations[0]);

		if (mutationSentence) {
			expect(mutationSentence).toBeInstanceOf(VariantSentence);
			expect(mutationSentence.action).toBe(VariantSentenceActions.NOTSEE);
			expect(mutationSentence.targets).toHaveLength(1);
			expect(mutationSentence.targets[0]).toBe('{inputFoo}');
			expect(mutationSentence.type).toBe(VariantSentenceType.AND);
		} else {
			throw new Error('mutationSentence is empty');
		}
	});

	it('generate mutation variant sentence of type attribute style display block', () => {
		let elm = document.getElementById('inputFoo') as HTMLInputElement;
		elm.setAttribute('style', 'display: block;');

		let mutations = observer.getRecords();

		expect(mutations).toHaveLength(1);

		const mutationSentence: any = featureutil.createMutationVariantSentence(mutations[0]);

		if (mutationSentence) {
			expect(mutationSentence).toBeInstanceOf(VariantSentence);
			expect(mutationSentence.action).toBe(VariantSentenceActions.SEE);
			expect(mutationSentence.targets).toHaveLength(1);
			expect(mutationSentence.targets[0]).toBe('{inputFoo}');
			expect(mutationSentence.type).toBe(VariantSentenceType.AND);
			expect(mutationSentence.attributtes).toHaveLength(1);
			expect(mutationSentence.attributtes[0]).toEqual({
				property: 'display',
				value: 'block',
			});
		} else {
			throw new Error('mutationSentence is empty');
		}
	});

	it('generate mutation variant sentence of removed element', () => {
		let elm = document.getElementById('divXpto') as HTMLDivElement;
		elm.remove();

		let mutations = observer.getRecords();

		expect(mutations).toHaveLength(1);

		const mutationSentence: any = featureutil.createMutationVariantSentence(mutations[0]);

		if (mutationSentence) {
			expect(mutationSentence).toBeInstanceOf(VariantSentence);
			expect(mutationSentence.action).toBe(VariantSentenceActions.REMOVE);
			expect(mutationSentence.targets).toHaveLength(1);
			expect(mutationSentence.targets[0]).toBe('{divXpto}');
			expect(mutationSentence.type).toBe(VariantSentenceType.AND);
		} else {
			throw new Error('mutationSentence is empty');
		}
	});

	it('generate mutation variant sentence of append element', () => {
		let elm = document.getElementById('divXpto') as HTMLDivElement;
		let btn = document.createElement('button');
		btn.setAttribute('id', 'btnXpto');
		elm.appendChild(btn);

		let mutations = observer.getRecords();

		expect(mutations).toHaveLength(1);

		const mutationSentence: any = featureutil.createMutationVariantSentence(mutations[0]);

		if (mutationSentence) {
			expect(mutationSentence).toBeInstanceOf(VariantSentence);
			expect(mutationSentence.action).toBe(VariantSentenceActions.APPEND);
			expect(mutationSentence.targets).toHaveLength(1);
			expect(mutationSentence.targets[0]).toBe('{btnXpto}');
			expect(mutationSentence.type).toBe(VariantSentenceType.AND);
		} else {
			throw new Error('mutationSentence is empty');
		}
	});

	it('generate mutation variant sentence for value assignment', () => {
		let elm = document.getElementById('inputFoo') as HTMLInputElement;
		elm.setAttribute('value', 'Test');

		let mutations = observer.getRecords();

		expect(mutations).toHaveLength(1);

		const mutationSentence: any = featureutil.createMutationVariantSentence(mutations[0]);

		if (mutationSentence) {
			expect(mutationSentence).toBeInstanceOf(VariantSentence);
			expect(mutationSentence.action).toBe(VariantSentenceActions.FILL);
			expect(mutationSentence.targets).toHaveLength(1);
			expect(mutationSentence.targets[0]).toBe('{inputFoo}');
			expect(mutationSentence.type).toBe(VariantSentenceType.AND);
			expect(mutationSentence.attributtes).toHaveLength(1);
			expect(mutationSentence.attributtes[0]).toEqual({ property: 'value', value: 'Test' });
		} else {
			throw new Error('mutationSentence is empty');
		}
	});
});

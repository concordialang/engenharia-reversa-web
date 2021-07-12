import { FeatureUtil } from '../../src/spec-analyser/FeatureUtil';
import { MutationObserverManager } from '../../src/mutation-observer/MutationObserverManager';
import { VariantSentenceActions } from '../../src/types/VariantSentenceActions';
import { VariantSentenceType } from '../../src/types/VariantSentenceType';
import { UIElement } from '../../src/spec-analyser/UIElement';
import { VariantSentence } from '../../src/spec-analyser/VariantSentence';
import clearElement from '../../src/util';

describe('MutationVariantSentencesGenerator', () => {
	const featureutil = new FeatureUtil();
	let observer: MutationObserverManager;

	beforeEach(() => {
		document.body.innerHTML = `<div id="divFoo">
                <input type="checkbox" id="foo" name="foo">
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

	it('generate mutation variant sentence of type attribute style display block', () => {
		let foo = document.getElementById('foo');

		if (foo) {
			foo.setAttribute('style', 'dispay: none;');
		} else {
			throw new Error('foo is empty');
		}

		let mutations = observer.getRecords();

		if (mutations.length > 0) {
			const mutationSentences: any = featureutil.createMutationVariantSentences(
				new UIElement(),
				mutations
			);
			expect(Array.isArray(mutationSentences)).toBe(true);
			expect(mutationSentences).toHaveLength(1);

			const mutationResult = mutationSentences[0];
			expect(mutationResult).toBeInstanceOf(VariantSentence);
			expect(mutationResult.action).toBe(VariantSentenceActions.SEE);
			expect(mutationResult.targets).toHaveLength(1);
			expect(mutationResult.targets[0]).toBe('{divXpto}');
			expect(mutationResult.type).toBe(VariantSentenceType.AND);
		} else {
			throw new Error('mutations is empty');
		}
	});

	it('generate mutation variant sentence of type attribute style display none', () => {
		let foo = document.getElementById('foo');
		if (foo) {
			foo.setAttribute('style', 'dispay: block;');
		} else {
			throw new Error('foo is empty');
		}

		let mutations = observer.getRecords();

		if (mutations.length > 0) {
			const mutationSentences: any = featureutil.createMutationVariantSentences(
				new UIElement(),
				mutations
			);
			expect(Array.isArray(mutationSentences)).toBe(true);
			expect(mutationSentences).toHaveLength(1);

			const mutationResult = mutationSentences[0];
			expect(mutationResult).toBeInstanceOf(VariantSentence);
			expect(mutationResult.action).toBe(VariantSentenceActions.NOTSEE);
			expect(mutationResult.targets).toHaveLength(1);
			expect(mutationResult.targets[0]).toBe('{divXpto}');
			expect(mutationResult.type).toBe(VariantSentenceType.AND);
		} else {
			throw new Error('mutations is empty');
		}
	});
});

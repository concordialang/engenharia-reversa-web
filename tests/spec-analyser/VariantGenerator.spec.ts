import { MutationObserverManager } from '../../src/content-script/mutation-observer/MutationObserverManager';
import { FeatureUtil } from '../../src/content-script/spec-analyser/FeatureUtil';
import { VariantGenerator } from '../../src/content-script/spec-analyser/VariantGenerator';

import { GraphStorage } from '../../src/content-script/storage/GraphStorage';

import { ElementInteraction } from '../../src/content-script/crawler/ElementInteraction';
import { ElementInteractionGraph } from '../../src/content-script/crawler/ElementInteractionGraph';
import { ElementInteractionExecutor } from '../../src/content-script/crawler/ElementInteractionExecutor';
import { BrowserContext } from '../../src/content-script/crawler/BrowserContext';
import { ElementInteractionGenerator } from '../../src/content-script/crawler/ElementInteractionGenerator';

import clearElement from '../../src/content-script/util';
import Mutex from '../../src/content-script/mutex/Mutex';
import { VariantSentencesGenerator } from '../../src/content-script/spec-analyser/VariantSentencesGenerator';
import { UIElementGenerator } from '../../src/content-script/spec-analyser/UIElementGenerator';
import { ElementAnalysisStorage } from '../../src/content-script/storage/ElementAnalysisStorage';
import { LocalObjectStorage } from '../../src/content-script/storage/LocalObjectStorage';
import { Feature } from '../../src/content-script/spec-analyser/Feature';
import { getDictionary } from '../../src/content-script/dictionary';
import { Spec } from '../../src/content-script/spec-analyser/Spec';
import { Variant } from '../../src/content-script/spec-analyser/Variant';
import { VariantGeneratorUtil } from '../../src/content-script/spec-analyser/VariantGeneratorUtil';
import { Interactor } from '../../src/content-script/crawler/Interactor';

describe('VariantGenerator', () => {
	const language = 'pt';
	const featureStorage = new LocalObjectStorage<Feature>(window.localStorage, Feature);
	const spec: Spec = new Spec(language, featureStorage);
	const dictionary = getDictionary(language);
	const uiElementGenerator = new UIElementGenerator();
	const variantSentencesGenerator = new VariantSentencesGenerator(uiElementGenerator);
	const featureUtil = new FeatureUtil(variantSentencesGenerator, dictionary);

	const url: URL = new URL('https://www.google.com');
	const interactionsGraphMutex: Mutex = new Mutex('interactions-graph-mutex');

	const elementAnalysisStorage: ElementAnalysisStorage = new ElementAnalysisStorage(
		window.localStorage
	);
	const elementInteracationStorage = new LocalObjectStorage<ElementInteraction<HTMLElement>>(
		window.localStorage,
		ElementInteraction
	);
	const graphStorage: GraphStorage = new GraphStorage(window.localStorage);

	const elementInteractionGraph = new ElementInteractionGraph(
		'graph',
		elementInteracationStorage,
		elementAnalysisStorage,
		graphStorage,
		interactionsGraphMutex
	);

	const interactor = new Interactor(window);

	const elementInteractionExecutor = new ElementInteractionExecutor(
		interactor,
		elementInteractionGraph
	);

	const pageUrl: URL = new URL(window.location.href);
	const browserContext = new BrowserContext(pageUrl, window);
	const elementInteractionGenerator = new ElementInteractionGenerator(browserContext);

	const variantGeneratorUtil = new VariantGeneratorUtil(dictionary);
	const variantGenerator = new VariantGenerator(
		elementInteractionGenerator,
		elementInteractionExecutor,
		featureUtil,
		variantGeneratorUtil
	);

	afterEach(() => {
		clearElement(document.body);
	});

	beforeEach(() => {
		document.body.innerHTML = `<section>
                <form action="" method="POST" id="form1">
                    <input type="text" id="input" name="input">
                    <input type="text" id="inputDisabled" name="inputDisabled" disabled='true'>
                    <input type="text" id="inputReadyOnly" name="inputReadyOnly" readonly>
                    <input type="text" id="inputDisplayNone" name="inputDisplayNone" style="display: none;">
                    <input type="text" id="inputVisibilityHidden" name="inputVisibilityHidden" style="visibility: hidden;">
                    <input type="text" id="inputHidden" name="inputHidden" hidden>
                    <input type="hidden" id="inputTypeHidden" name="inputTypeHidden">
        
                    <br>
        
                    <textarea id="textarea" name="textarea"></textarea>
                    <textarea id="textareaDisabled" name="textareaDisabled" disabled='true'></textarea>
                    <textarea id="textareaReadOnly" name="textareaReadOnly" readonly></textarea>
                    <textarea id="textareaDisplayNone" name="textareaDisplayNone" style="display: none;"></textarea>
                    <textarea id="textareaVisibilityHidden" name="textareaVisibilityHidden" style="visibility: hidden;"></textarea>
                    <textarea id="textareaHidden" name="textareaHidden" hidden></textarea>
        
                    <br>
        
                    <select id="select" name="select">
                        <option value="1">test1</option>
                        <option value="2">test2</option>
                        <option value="3">test3</option>
                    </select>
                    <select id="selectDisabled" name="selectDisabled" disabled='true'>
                        <option value="1">test1</option>
                        <option value="2">test2</option>
                        <option value="3">test3</option>
                    </select>
                    <select id="selectDisplayNone" name="selectDisplayNone" style="display: none;">
                        <option value="1">test1</option>
                        <option value="2">test2</option>
                        <option value="3">test3</option>
                    </select>
                    <select id="selectVisibilityHidden" name="selectVisibilityHidden" style="visibility: hidden;">
                        <option value="1">test1</option>
                        <option value="2">test2</option>
                        <option value="3">test3</option>
                    </select>
                    <select id="selectHidden" name="selectHidden" hidden>
                        <option value="1">test1</option>
                        <option value="2">test2</option>
                        <option value="3">test3</option>
                    </select>
                    
                    <br>
        
                    <!-- <button type="button" id="button" name="button"> Teste </button>
                    <button type="button" id="buttonDisabled" name="buttonDisabled" disabled='true'> Teste </button>
                    <button type="button" id="buttonDisplayNone" name="buttonDisplayNone" style="display: none;"> Teste </button>
                    <button type="button" id="buttonVisibilityHidden" name="buttonVisibilityHidden" style="visibility: hidden;"> Teste </button>
                    <button type="button" id="buttonHidden" name="buttonHidden" hidden> Teste </button> -->
                </form>
            </section>
        
            <footer id="footer">
                <p>Footer</p>
            </footer>`;
	});

	it('generate variants', async () => {
		const url = new URL('https://www.google.com');
		const observer = new MutationObserverManager(document.body);
		const feature = featureUtil.createFeatureFromElement(
			document.body,
			spec.getFeatures().length
		);
		const variant = await variantGenerator.generate(document.body, url, observer, feature);
		expect(variant).toBeInstanceOf(Variant);
	});
});

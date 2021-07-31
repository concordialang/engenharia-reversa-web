import { MutationObserverManager } from '../../src/mutation-observer/MutationObserverManager';
import { FeatureUtil } from '../../src/spec-analyser/FeatureUtil';
import { VariantGenerator } from '../../src/spec-analyser/VariantGenerator';

import { AnalyzedElementStorage } from '../../src/storage/AnalyzedElementStorage';
import { ElementInteractionStorage } from '../../src/storage/ElementInteractionStorage';
import { GraphStorage } from '../../src/storage/GraphStorage';

import { AnalyzedElement } from '../../src/crawler/AnalyzedElement';
import { ElementInteraction } from '../../src/crawler/ElementInteraction';
import { ElementInteractionGraph } from '../../src/crawler/ElementInteractionGraph';
import { InputInteractor } from '../../src/crawler/InputInteractor';
import { ButtonInteractor } from '../../src/crawler/ButtonInteractor';
import { ElementInteractionExecutor } from '../../src/crawler/ElementInteractionExecutor';
import { BrowserContext } from '../../src/crawler/BrowserContext';
import { ElementInteractionGenerator } from '../../src/crawler/ElementInteractionGenerator';

import clearElement from '../../src/util';
import Mutex from '../../src/mutex/Mutex';

describe('VariantGenerator', () => {
	const featureUtil = new FeatureUtil();
	// let redirectionCallback = async (interaction: ElementInteraction<HTMLElement>) => {
	// 	const analyzedElement = new AnalyzedElement(
	// 		interaction.getElement(),
	// 		interaction.getPageUrl()
	// 	);
	// 	await analyzedElementStorage.set(analyzedElement.getId(), analyzedElement);
	// };

	const url: URL = new URL('https://www.google.com');
	const interactionsGraphMutex: Mutex = new Mutex('interactions-graph-mutex');

	const analyzedElementStorage: AnalyzedElementStorage = new AnalyzedElementStorage(
		window.localStorage,
		document
	);
	const elementInteracationStorage = new ElementInteractionStorage(window.localStorage, document);
	const graphStorage: GraphStorage = new GraphStorage(window.localStorage);

	const elementInteractionGraph = new ElementInteractionGraph(
		elementInteracationStorage,
		analyzedElementStorage,
		graphStorage,
		interactionsGraphMutex
	);

	const inputInteractor = new InputInteractor();
	const buttonInteractor = new ButtonInteractor(window);

	const elementInteractionExecutor = new ElementInteractionExecutor(
		inputInteractor,
		buttonInteractor,
		elementInteractionGraph
	);

	const pageUrl: URL = new URL(window.location.href);
	const browserContext = new BrowserContext(document, pageUrl, window);
	const elementInteractionGenerator = new ElementInteractionGenerator(browserContext);

	const variantGenerator = new VariantGenerator(
		elementInteractionExecutor,
		elementInteractionGenerator,
		featureUtil,
		analyzedElementStorage
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

	it('generate variants', () => {
		const variants = variantGenerator.generate(document.body, false);
		expect(variants).toHaveLength(1);
		expect(variants).toBeInstanceOf(Array);
	});
});

import Mutex from '../src/mutex/Mutex';
import { ChromeCommunicationChannel } from '../src/comm/ChromeCommunicationChannel';
import { BrowserContext } from '../src/crawler/BrowserContext';
import { ButtonInteractor } from '../src/crawler/ButtonInteractor';
import { ElementInteractionExecutor } from '../src/crawler/ElementInteractionExecutor';
import { ElementInteractionGenerator } from '../src/crawler/ElementInteractionGenerator';
import { ElementInteractionGraph } from '../src/crawler/ElementInteractionGraph';
import { InputInteractor } from '../src/crawler/InputInteractor';
import { PageAnalyzer } from '../src/crawler/PageAnalyzer';
import { VisitedURLGraph } from '../src/crawler/VisitedURLGraph';
import { FeatureManager } from '../src/spec-analyser/FeatureManager';
import { FeatureUtil } from '../src/spec-analyser/FeatureUtil';
import { Spec } from '../src/spec-analyser/Spec';
import { UIElementGenerator } from '../src/spec-analyser/UIElementGenerator';
import { VariantGenerator } from '../src/spec-analyser/VariantGenerator';
import { VariantSentencesGenerator } from '../src/spec-analyser/VariantSentencesGenerator';
import { ElementAnalysisStorage } from '../src/storage/ElementAnalysisStorage';
import { ElementInteractionStorage } from '../src/storage/ElementInteractionStorage';
import { GraphStorage } from '../src/storage/GraphStorage';
import { PageStorage } from '../src/storage/PageStorage';
import { LocalStorageMock } from './util/LocalStorageMock';
import { getPathTo } from '../src/util';
import { ElementAnalysisStatus } from '../src/crawler/ElementAnalysisStatus';

describe('Page Analyzer', () => {
	it('sets element analysis status to "InProgress" when its being analyzed', async () => {
		const document = getRootHtmlDocument();

		const innerHTML = `<div id="div1"><input id="input1" type="text"></input></div>`;
		const div = document.createElement('div');
		div.innerHTML = innerHTML;
		const body = document.getElementsByTagName('body')[0];
		body.appendChild(div);

		const pageUrl: URL = new URL(window.location.href);
		const elementAnalysisStorage = new ElementAnalysisStorage(window.localStorage, document);

		const pageAnalyzer = buildPageAnalyzer({
			document: document,
			pageUrl: pageUrl,
			elementAnalysisStorage: elementAnalysisStorage,
		});

		const div1 = document.getElementById('div1');
		expect(div1).not.toBeNull();
		if (div1) {
			await pageAnalyzer.analyze(pageUrl, div1);

			const pathToElement = getPathTo(div1);
			const div1AnalysisStatus = await elementAnalysisStorage.getElementAnalysisStatus(
				pathToElement,
				pageUrl
			);

			expect(div1AnalysisStatus).toBe(ElementAnalysisStatus.InProgress);
		}
	});

	function buildPageAnalyzer(
		options:
			| {
					document?: HTMLDocument;
					pageUrl?: URL;
					elementAnalysisStorage?: ElementAnalysisStorage;
			  }
			| undefined = {}
	): PageAnalyzer {
		const dom = options.document ?? document;

		const tabId = 'tab-test';

		const interactionsGraphMutex: Mutex = new Mutex('interactions-graph-mutex-' + tabId);

		const graphStorage: GraphStorage = new GraphStorage(window.localStorage);

		const inputInteractor = new InputInteractor();
		const buttonInteractor = new ButtonInteractor(window);
		const elementInteracationStorage = new ElementInteractionStorage(window.localStorage, dom);
		const spec: Spec = new Spec('pt-br');

		let elementAnalysisStorage: ElementAnalysisStorage;
		if (options.elementAnalysisStorage) {
			elementAnalysisStorage = options.elementAnalysisStorage;
		} else {
			elementAnalysisStorage = new ElementAnalysisStorage(window.localStorage, dom);
		}

		const elementInteractionGraph = new ElementInteractionGraph(
			tabId,
			elementInteracationStorage,
			elementAnalysisStorage,
			graphStorage,
			interactionsGraphMutex
		);

		const elementInteractionExecutor = new ElementInteractionExecutor(
			inputInteractor,
			buttonInteractor,
			elementInteractionGraph
		);

		const pageUrl: URL = new URL(window.location.href);

		const browserContext = new BrowserContext(dom, pageUrl, window);
		const elementInteractionGenerator = new ElementInteractionGenerator(browserContext);

		const uiElementGenerator = new UIElementGenerator();

		const variantSentencesGenerator = new VariantSentencesGenerator(uiElementGenerator);

		const featureUtil = new FeatureUtil(variantSentencesGenerator);

		const variantGenerator: VariantGenerator = new VariantGenerator(
			elementInteractionExecutor,
			elementInteractionGenerator,
			featureUtil
		);

		const featureManager = new FeatureManager(
			variantGenerator,
			featureUtil,
			elementAnalysisStorage,
			spec
		);

		const pageAnalyzer = new PageAnalyzer(
			featureManager,
			elementAnalysisStorage,
			spec,
			browserContext
		);
		return pageAnalyzer;
	}

	function getRootHtmlDocument(): HTMLDocument {
		const dom = document.implementation.createHTMLDocument('Fake document');
		return dom;
	}
});

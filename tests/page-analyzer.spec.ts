import { BrowserContext } from '../src/content-script/crawler/BrowserContext';
import { ElementInteractionExecutor } from '../src/content-script/crawler/ElementInteractionExecutor';
import { ElementInteractionGenerator } from '../src/content-script/crawler/ElementInteractionGenerator';
import { ElementInteractionGraph } from '../src/content-script/crawler/ElementInteractionGraph';
import { PageAnalyzer } from '../src/content-script/crawler/PageAnalyzer';
import { FeatureGenerator } from '../src/content-script/spec-analyser/FeatureGenerator';
import { FeatureUtil } from '../src/content-script/spec-analyser/FeatureUtil';
import { Spec } from '../src/content-script/spec-analyser/Spec';
import { UIElementGenerator } from '../src/content-script/spec-analyser/UIElementGenerator';
import { VariantGenerator } from '../src/content-script/spec-analyser/VariantGenerator';
import { VariantSentencesGenerator } from '../src/content-script/spec-analyser/VariantSentencesGenerator';
import { ElementAnalysisStorage } from '../src/content-script/storage/ElementAnalysisStorage';
import { GraphStorage } from '../src/content-script/storage/GraphStorage';
import { getPathTo } from '../src/content-script/util';
import { ElementAnalysisStatus } from '../src/content-script/crawler/ElementAnalysisStatus';
import { ElementAnalysis } from '../src/content-script/crawler/ElementAnalysis';
import { LocalObjectStorage } from '../src/content-script/storage/LocalObjectStorage';
import { ElementInteraction } from '../src/content-script/crawler/ElementInteraction';
import { getDictionary } from '../src/content-script/dictionary';
import { Feature } from '../src/content-script/spec-analyser/Feature';
import { VariantGeneratorUtil } from '../src/content-script/spec-analyser/VariantGeneratorUtil';
import { Interactor } from '../src/content-script/crawler/Interactor';

describe('Page Analyzer', () => {
	it('sets element analysis status to "InProgress" when its being analyzed', async () => {
		const document = getRootHtmlDocument();

		const innerHTML = `<div id="div1"><input id="input1" type="text"></input></div>`;
		const div = document.createElement('div');
		div.innerHTML = innerHTML;
		const body = document.getElementsByTagName('body')[0];
		body.appendChild(div);

		const pageUrl: URL = new URL(window.location.href);
		const elementAnalysisStorage = new ElementAnalysisStorage(window.localStorage);

		const pageAnalyzer = buildPageAnalyzer({
			document: document,
			pageUrl: pageUrl,
			elementAnalysisStorage: elementAnalysisStorage,
		});

		const div1 = document.getElementById('div1');
		expect(div1).not.toBeNull();
		if (div1) {
			try {
				await pageAnalyzer.analyze(pageUrl, div1);
			} catch (ForcingExecutionStoppageError) {
				// ignore
			}

			const pathToElement = getPathTo(div1);
			const div1AnalysisStatus = await elementAnalysisStorage.getElementAnalysisStatus(
				pathToElement,
				pageUrl
			);

			expect(div1AnalysisStatus).toBe(ElementAnalysisStatus.InProgress);
		}
	});

	it("doesn't analyze element if its analysis status is in progress", async () => {
		const document = getRootHtmlDocument();

		const innerHTML = `<div id="div1"><input id="input1" type="text"></input></div>`;
		const div = document.createElement('div');
		div.innerHTML = innerHTML;
		const body = document.getElementsByTagName('body')[0];
		body.appendChild(div);

		const pageUrl: URL = new URL(window.location.href);
		const elementAnalysisStorage = new ElementAnalysisStorage(window.localStorage);

		const elementAnalysisStorageMock = new ElementAnalysisStorage(window.localStorage);

		const set = jest.fn().mockImplementation((key: string, obj: ElementAnalysis) => {});
		elementAnalysisStorageMock.set = set;

		const pageAnalyzer = buildPageAnalyzer({
			document: document,
			pageUrl: pageUrl,
			elementAnalysisStorage: elementAnalysisStorageMock,
		});

		const div1 = document.getElementById('div1');
		expect(div1).not.toBeNull();
		if (div1) {
			const elementAnalysis = new ElementAnalysis(
				div1,
				pageUrl,
				ElementAnalysisStatus.InProgress
			);
			elementAnalysisStorage.set(elementAnalysis.getId(), elementAnalysis);

			await pageAnalyzer.analyze(pageUrl, div1);

			expect(set).not.toHaveBeenCalled();
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

		const graphStorage: GraphStorage = new GraphStorage(window.localStorage);

		const elementInteracationStorage = new LocalObjectStorage<ElementInteraction<HTMLElement>>(
			window.localStorage,
			ElementInteraction
		);

		const language = 'pt';
		const featureStorage = new LocalObjectStorage<Feature>(window.localStorage, Feature);
		const spec: Spec = new Spec(language, featureStorage);
		const dictionary = getDictionary(language);

		let elementAnalysisStorage: ElementAnalysisStorage;
		if (options.elementAnalysisStorage) {
			elementAnalysisStorage = options.elementAnalysisStorage;
		} else {
			elementAnalysisStorage = new ElementAnalysisStorage(window.localStorage);
		}

		const elementInteractionGraph = new ElementInteractionGraph(
			tabId,
			elementInteracationStorage,
			elementAnalysisStorage,
			graphStorage
		);

		const interactor = new Interactor(window);

		const elementInteractionExecutor = new ElementInteractionExecutor(
			interactor,
			elementInteractionGraph
		);

		const pageUrl: URL = new URL(window.location.href);

		const browserContext = new BrowserContext(pageUrl, window);
		const elementInteractionGenerator = new ElementInteractionGenerator(browserContext);

		const uiElementGenerator = new UIElementGenerator();

		const variantSentencesGenerator = new VariantSentencesGenerator(uiElementGenerator);

		const featureUtil = new FeatureUtil(variantSentencesGenerator, dictionary);

		const variantGeneratorUtil = new VariantGeneratorUtil(dictionary);
		const variantGenerator: VariantGenerator = new VariantGenerator(
			elementInteractionGenerator,
			elementInteractionExecutor,
			featureUtil,
			variantGeneratorUtil
		);

		const featureGenerator = new FeatureGenerator(
			variantGenerator,
			featureUtil,
			elementAnalysisStorage,
			spec,
			browserContext,
			elementInteractionGraph
		);

		const pageAnalyzer = new PageAnalyzer(
			featureGenerator,
			elementAnalysisStorage,
			spec,
			browserContext,
			new LocalObjectStorage<Feature>(window.localStorage, Feature),
			elementInteractionExecutor,
			elementInteractionGraph
		);
		return pageAnalyzer;
	}

	function getRootHtmlDocument(): HTMLDocument {
		const dom = document.implementation.createHTMLDocument('Fake document');
		return dom;
	}
});

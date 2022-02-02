import { Spec } from './spec-analyser/Spec';
import { FeatureGenerator } from './spec-analyser/FeatureGenerator';
import { ElementAnalysisStorage } from './storage/ElementAnalysisStorage';
import { VariantGenerator } from './spec-analyser/VariantGenerator';
import { GraphStorage } from './storage/GraphStorage';
import Mutex from './mutex/Mutex';
import { FeatureUtil } from './spec-analyser/FeatureUtil';
import { UIElementGenerator } from './spec-analyser/UIElementGenerator';
import { VariantSentencesGenerator } from './spec-analyser/VariantSentencesGenerator';
import { LocalObjectStorage } from './storage/LocalObjectStorage';
import { IndexedDBObjectStorage } from '../shared/storage/IndexedDBObjectStorage';
import { ChromeCommunicationChannel } from '../shared/comm/ChromeCommunicationChannel';
import { CommunicationChannel } from '../shared/comm/CommunicationChannel';
import { getDictionary } from './dictionary';
import { ElementInteractionGraph } from './crawler/ElementInteractionGraph';
import { ElementInteractionExecutor } from './crawler/ElementInteractionExecutor';
import { VisitedURLGraph } from './crawler/VisitedURLGraph';
import { ElementInteractionGenerator } from './crawler/ElementInteractionGenerator';
import { BrowserContext } from './crawler/BrowserContext';
import { Crawler } from './crawler/Crawler';
import { PageAnalyzer } from './crawler/PageAnalyzer';
import { Message } from '../shared/comm/Message';
import { Command } from '../shared/comm/Command';
import { AppEvent } from '../shared/comm/AppEvent';
import { ElementInteractionStorage } from '../content-script/storage/ElementInteractionStorage';
import { Feature } from './spec-analyser/Feature';
import { VariantGeneratorUtil } from './spec-analyser/VariantGeneratorUtil';
import { Interactor } from './crawler/Interactor';
import { Variant } from './spec-analyser/Variant';
import { GraphRenderer } from './graph/GraphRenderer';
import { InMemoryStorage } from '../content-script/storage/InMemoryStorage';
import { PageAnalysisStorage } from './storage/PageAnalysisStorage';
import { BackgroundIndexedDBObjectStorage } from './storage/BackgroundIndexedDBObjectStorage';
import { IndexedDBDatabases } from '../shared/storage/IndexedDBDatabases';

const communicationChannel: CommunicationChannel = new ChromeCommunicationChannel(chrome);

getTabId(communicationChannel).then((tabId) => {
	tabId = 'tab-' + tabId;

	const visitedPagesGraphMutex: Mutex = new Mutex('visited-pages-graph-mutex');

	const pageStorage = new InMemoryStorage<string>(communicationChannel);

	const analysisElementXPathStorage = new InMemoryStorage<string>(communicationChannel);

	const graphStorage: GraphStorage = new GraphStorage(communicationChannel);

	const featureStorage = new BackgroundIndexedDBObjectStorage<Feature>(
		IndexedDBDatabases.Features, 
		IndexedDBDatabases.Features, 
		communicationChannel, 
		Feature
	);

	const variantStorage = new InMemoryStorage<Variant>(communicationChannel, Variant);

	const elementInteractionStorage = new ElementInteractionStorage(
		communicationChannel,
		featureStorage,
		variantStorage
	);

	const language = 'pt';
	const dictionary = getDictionary(language);

	const elementAnalysisStorage = new ElementAnalysisStorage(communicationChannel);

	const pageAnalysisStorage = new PageAnalysisStorage(communicationChannel);

	const elementInteractionGraph = new ElementInteractionGraph(
		tabId,
		elementInteractionStorage,
		elementAnalysisStorage,
		graphStorage,
		pageAnalysisStorage
	);

	const visitedURLGraph = new VisitedURLGraph(graphStorage, visitedPagesGraphMutex);

	const interactor = new Interactor(window);

	const elementInteractionExecutor = new ElementInteractionExecutor(
		interactor,
		elementInteractionGraph
	);

	const pageUrl: URL = new URL(window.location.href);

	const browserContext = new BrowserContext(pageUrl, window, tabId);
	const elementInteractionGenerator = new ElementInteractionGenerator(browserContext);

	const uiElementGenerator = new UIElementGenerator();

	const variantSentencesGenerator = new VariantSentencesGenerator(uiElementGenerator);

	const featureUtil = new FeatureUtil(variantSentencesGenerator, dictionary);

	const variantGeneratorUtil = new VariantGeneratorUtil(dictionary);
	const variantGenerator: VariantGenerator = new VariantGenerator(
		elementInteractionGenerator,
		elementInteractionExecutor,
		featureUtil,
		variantGeneratorUtil,
		elementAnalysisStorage
	);

	//const specStorage = new LocalObjectStorage<Spec>(window.localStorage, Spec);
	const specStorage = new InMemoryStorage<Spec>(communicationChannel, Spec);


	const featureGenerator = new FeatureGenerator(
		variantGenerator,
		featureUtil,
		elementAnalysisStorage,
		browserContext,
		elementInteractionGraph,
		variantStorage
	);

	const pageAnalyzer = new PageAnalyzer(
		featureGenerator,
		elementAnalysisStorage,
		browserContext,
		featureStorage,
		elementInteractionExecutor,
		elementInteractionGraph,
		communicationChannel,
		pageAnalysisStorage
	);

	const specMutex: Mutex = new Mutex('spec-mutex');

	const crawler: Crawler = new Crawler(
		browserContext,
		pageStorage,
		elementInteractionGraph,
		visitedURLGraph,
		pageAnalyzer,
		communicationChannel,
		elementAnalysisStorage,
		featureStorage,
		specStorage,
		specMutex,
		analysisElementXPathStorage
	);

	communicationChannel.setMessageListener(async function (message: Message) {
		if (message.includesAction(Command.CleanGraph)) {
			clean();
		}
		if (message.includesAction(Command.Crawl)) {
			overrideWindowOpen();
			overrideJavascriptPopups();
			const finished = await crawler.crawl();
			if (finished) {
				communicationChannel.sendMessageToAll(
					new Message([AppEvent.Finished], JSON.stringify(specStorage))
				);
			}
		}
	});

	//definir no protocolo de comunicação maneira para que a comunicação da extensão não interfira com a de outras extensões, e vice-versa
	communicationChannel.sendMessageToAll(new Message([AppEvent.Loaded]));

	// FIXME Na chamada a essa função, esperar ela terminar antes de executar o resto, caso contrário, não irá esperar limpar tudo antes de continuar
	async function clean(): Promise<void> {
		await elementInteractionGraph.clean();
		//temporario
		const keys = Object.keys(window.localStorage);
		for (const key of keys) {
			window.localStorage.removeItem(key);
		}
		crawler.resetLastPage();
	}

	if(pageUrl.pathname === '/visualizacao-grafo-url/'){
		const graphRenderer = new GraphRenderer(communicationChannel, elementInteractionStorage);
		graphRenderer.render();
	}
});

function overrideJavascriptPopups() {
	const script = document.createElement('script');
	const func = () => {
		// @ts-ignore
		alert = function () {};
		// @ts-ignore
		confirm = function () {
			return true;
		};
		// @ts-ignore
		prompt = function (text, defaultText) {
			return defaultText;
		};
	};
	script.innerHTML = `const overridePopups = ${func.toString()}; overridePopups();`;
	document.body.appendChild(script);
}

function overrideWindowOpen() {
	const script = document.createElement('script');
	const func = () => {
		document.querySelectorAll('[target="_blank"]').forEach(function (element) {
			element.removeAttribute('target');
		});

		// @ts-ignore
		window.open = (url) => {
			// @ts-ignore
			window.location.href = url;
		};
	};
	script.innerHTML = `const overrideWindowOpen = ${func.toString()}; overrideWindowOpen();`;
	document.body.appendChild(script);
}

async function getTabId(comChannel: CommunicationChannel): Promise<string> {
	const message = new Message([Command.GetTabId]);
	const responseMessage = await comChannel.sendMessageToAll(message);
	const tabId = responseMessage.getExtra();
	return tabId;
}

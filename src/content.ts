import { Spec } from './spec-analyser/Spec';
import { FeatureManager } from './spec-analyser/FeatureManager';
import { AppEvent } from './comm/AppEvent';
import { ChromeCommunicationChannel } from './comm/ChromeCommunicationChannel';
import { Command } from './comm/Command';
import { CommunicationChannel } from './comm/CommunicationChannel';
import { Message } from './comm/Message';
import { AnalyzedElementStorage } from './storage/AnalyzedElementStorage';
import { BrowserContext } from './crawler/BrowserContext';
import { ButtonInteractor } from './crawler/ButtonInteractor';
import { Crawler } from './crawler/Crawler';
import { ElementInteractionExecutor } from './crawler/ElementInteractionExecutor';
import { ElementInteractionStorage } from './storage/ElementInteractionStorage';
import { VariantGenerator } from './spec-analyser/VariantGenerator';
import { InputInteractor } from './crawler/InputInteractor';
import { PageStorage } from './storage/PageStorage';
import { GraphStorage } from './storage/GraphStorage';
import Mutex from './mutex/Mutex';
import { ElementInteractionGraph } from './crawler/ElementInteractionGraph';
import { VisitedURLGraph } from './crawler/VisitedURLGraph';
import { ElementInteractionGenerator } from './crawler/ElementInteractionGenerator';
import { PageAnalyzer } from './crawler/PageAnalyzer';
import { FeatureUtil } from './spec-analyser/FeatureUtil';
import { UIElementGenerator } from './spec-analyser/UIElementGenerator';
import { VariantSentencesGenerator } from './spec-analyser/VariantSentencesGenerator';

const communicationChannel: CommunicationChannel = new ChromeCommunicationChannel();

getTabId(communicationChannel).then((tabId) => {
	tabId = 'tab-' + tabId;

	const visitedPagesGraphMutex: Mutex = new Mutex('visited-pages-graph-mutex');

	const interactionsGraphMutex: Mutex = new Mutex('interactions-graph-mutex-' + tabId);

	const pageStorage = new PageStorage('engenharia-reversa-web');

	const graphStorage: GraphStorage = new GraphStorage(window.localStorage);

	const inputInteractor = new InputInteractor();
	const buttonInteractor = new ButtonInteractor(window);
	const elementInteracationStorage = new ElementInteractionStorage(window.localStorage, document);
	const spec: Spec = new Spec('pt-br');
	const analyzedElementStorage = new AnalyzedElementStorage(window.localStorage, document);

	const elementInteractionGraph = new ElementInteractionGraph(
		tabId,
		elementInteracationStorage,
		analyzedElementStorage,
		graphStorage,
		interactionsGraphMutex
	);

	const visitedURLGraph = new VisitedURLGraph(graphStorage, visitedPagesGraphMutex);

	const elementInteractionExecutor = new ElementInteractionExecutor(
		inputInteractor,
		buttonInteractor,
		elementInteractionGraph
	);

	const pageUrl: URL = new URL(window.location.href);

	const browserContext = new BrowserContext(document, pageUrl, window);
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
		analyzedElementStorage,
		spec
	);

	const pageAnalyzer = new PageAnalyzer(featureManager, analyzedElementStorage, spec);

	const crawler: Crawler = new Crawler(
		browserContext,
		pageStorage,
		elementInteractionGraph,
		visitedURLGraph,
		pageAnalyzer,
		communicationChannel,
		analyzedElementStorage
	);

	communicationChannel.setMessageListener(function (message: Message) {
		if (message.includesAction(Command.CleanGraph)) {
			clean();
		}
		if (message.includesAction(Command.Crawl)) {
			overrideWindowOpen();
			overrideJavascriptPopups();
			crawler.crawl();
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

async function getTabId(communicationChannel: CommunicationChannel): Promise<string> {
	const message = new Message([Command.GetTabId]);
	const responseMessage = await communicationChannel.sendMessageToAll(message);
	const tabId = responseMessage.getExtra();
	return tabId;
}

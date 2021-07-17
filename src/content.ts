import { Spec } from './spec-analyser/Spec';
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
import { VariantGenerator } from './crawler/VariantGenerator';
import { InputInteractor } from './crawler/InputInteractor';
import { PageStorage } from './storage/PageStorage';
import { GraphStorage } from './storage/GraphStorage';
import Mutex from './mutex/Mutex';
import { ElementInteractionGraph } from './crawler/ElementInteractionGraph';
import { VisitedURLGraph } from './crawler/VisitedURLGraph';
import { ElementInteractionGenerator } from './crawler/ElementInteractionGenerator';
import { PageAnalyzer } from './crawler/PageAnalyzer';
import { FeatureUtil } from './spec-analyser/FeatureUtil';

const visitedPagesGraphMutex: Mutex = new Mutex('visited-pages-graph-mutex');
const interactionsGraphMutex: Mutex = new Mutex('interactions-graph-mutex');

const pageStorage = new PageStorage('engenharia-reversa-web');

const graphStorage: GraphStorage = new GraphStorage(window.localStorage);
const graphKey = 'graph';
const elementInteractionGraphKey = 'interactions-graph';
const communicationChannel: CommunicationChannel = new ChromeCommunicationChannel();
const inputInteractor = new InputInteractor();
const buttonInteractor = new ButtonInteractor(window);
const elementInteracationStorage = new ElementInteractionStorage(window.localStorage, document);
const spec: Spec = new Spec('pt-br');
const analyzedElementStorage = new AnalyzedElementStorage(window.localStorage, document);

const elementInteractionGraph = new ElementInteractionGraph(
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

const featureUtil = new FeatureUtil();

const variantGenerator: VariantGenerator = new VariantGenerator(
	elementInteractionExecutor,
	elementInteractionGenerator,
	featureUtil
);

const pageAnalyzer = new PageAnalyzer(variantGenerator, analyzedElementStorage);

const crawler: Crawler = new Crawler(
	browserContext,
	variantGenerator,
	pageStorage,
	elementInteractionGraph,
	visitedURLGraph,
	analyzedElementStorage,
	pageAnalyzer
);

communicationChannel.setMessageListener(function (message: Message) {
	if (message.includesAction(Command.CleanGraph)) {
		clean();
	}
	if (message.includesAction(Command.Crawl)) {
		overwriteJavascriptPopups();
		crawler.crawl();
	}
});

//definir no protocolo de comunicação maneira para que a comunicação da extensão não interfira com a de outras extensões, e vice-versa
communicationChannel.sendMessageToAll(new Message([AppEvent.Loaded]));

// FIXME Na chamada a essa função, esperar ela terminar antes de executar o resto, caso contrário, não irá esperar limpar tudo antes de continuar
function clean(): void {
	graphStorage
		.remove(graphKey)
		.then(() => {
			graphStorage.remove(elementInteractionGraphKey);
		})
		.then(() => {
			//temporario
			const keys = Object.keys(window.localStorage);
			for (const key of keys) {
				window.localStorage.removeItem(key);
			}
		})
		.then(() => {
			crawler.resetLastPage();
		});
}

function overwriteJavascriptPopups() {
	var script = document.createElement('script');
	script.innerHTML =
		'alert = function(){};confirm = function(){return true;};prompt = function(text,defaultText){return defaultText;}';
	document.body.appendChild(script);
}

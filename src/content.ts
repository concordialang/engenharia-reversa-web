import { FeatureCollection } from './analysis/FeatureCollection';
import { Spec } from './analysis/Spec';
import { AppEvent } from './comm/AppEvent';
import { ChromeCommunicationChannel } from './comm/ChromeCommunicationChannel';
import { Command } from './comm/Command';
import { CommunicationChannel } from './comm/CommunicationChannel';
import { Message } from './comm/Message';
import { AnalyzedElementStorage } from './crawler/AnalyzedElementStorage';
import { BrowserContext } from './crawler/BrowserContext';
import { ButtonInteractor } from './crawler/ButtonInteractor';
import { Crawler } from './crawler/Crawler';
import { ElementInteractionManager } from './crawler/ElementInteractionManager';
import { ElementInteractionStorage } from './storage/ElementInteractionStorage';
import { FeatureGenerator } from './crawler/FeatureGenerator';
import { FeatureStorage } from './storage/FeatureStorage';
import { InputInteractor } from './crawler/InputInteractor';
import { PageStorage } from './storage/PageStorage';
import { GraphStorage } from './storage/GraphStorage';
import Mutex from './mutex/Mutex';

const visitedPagesGraphMutex: Mutex = new Mutex('visited-pages-graph-mutex');
const interactionsGraphMutex: Mutex = new Mutex('interactions-graph-mutex');

const lastPageKey = 'lastPage';
const pageStorage = new PageStorage('engenharia-reversa-web');

const graphStorage: GraphStorage = new GraphStorage(window.localStorage);
const featureStorage: FeatureStorage = new FeatureStorage(window.localStorage);
const graphKey = 'graph';
const elementInteractionGraphKey = 'interactions-graph';
const lastElementInteractionKey = 'last-interaction';
const lastElementInteractionBeforeRedirectKey = 'last-interaction-before-redirect';
const communicationChannel: CommunicationChannel = new ChromeCommunicationChannel();
const featureAnalyzer: FeatureCollection = new FeatureCollection();
const inputInteractor = new InputInteractor();
const buttonInteractor = new ButtonInteractor(window);
const elementInteracationStorage = new ElementInteractionStorage(window.localStorage, document);
const spec: Spec = new Spec('pt-br');
const analyzedElementStorage = new AnalyzedElementStorage(document);

const elementInteractionManager = new ElementInteractionManager(
	inputInteractor,
	buttonInteractor,
	elementInteractionGraphKey,
	graphStorage,
	elementInteracationStorage,
	interactionsGraphMutex,
	lastElementInteractionKey
);

const pageUrl: URL = new URL(window.location.href);
const featureGenerator: FeatureGenerator = new FeatureGenerator(
	elementInteractionManager,
	pageUrl,
	spec,
	graphStorage,
	elementInteracationStorage,
	elementInteractionGraphKey,
	lastElementInteractionBeforeRedirectKey,
	lastElementInteractionKey,
	analyzedElementStorage
);

const browserContext = new BrowserContext(document, pageUrl, window);

const crawler: Crawler = new Crawler(
	browserContext,
	graphStorage,
	visitedPagesGraphMutex,
	graphKey,
	featureGenerator,
	analyzedElementStorage,
	elementInteracationStorage,
	elementInteractionGraphKey,
	lastElementInteractionKey,
	pageStorage,
	lastPageKey
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
			pageStorage.remove(lastPageKey);
		});
}

function overwriteJavascriptPopups() {
	var script = document.createElement('script');
	script.innerHTML =
		'alert = function(){};confirm = function(){return true;};prompt = function(text,defaultText){return defaultText;}';
	document.body.appendChild(script);
}

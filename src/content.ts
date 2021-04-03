import { FeatureAnalyzer } from './app/analysis/FeatureAnalyzer';
import { AppEvent } from './app/comm/AppEvent';
import { ChromeCommunicationChannel } from './app/comm/ChromeCommunicationChannel';
import { Command } from './app/comm/Command';
import { CommunicationChannel } from './app/comm/CommunicationChannel';
import { Message } from './app/comm/Message';
import { ButtonInteractor } from './app/crawler/ButtonInteractor';
import { Crawler } from './app/crawler/Crawler';
import { ElementInteractionManager } from './app/crawler/ElementInteractionManager';
import { ElementInteractionStorage } from './app/crawler/ElementInteractionStorage';
import { FeatureStorage } from './app/crawler/FeatureStorage';
import { FormFiller } from './app/crawler/FormFiller';
import { InputInteractor } from './app/crawler/InputInteractor';
import { UrlListStorage } from './app/crawler/UrlListStorage';
import { GraphStorage } from './app/graph/GraphStorage';
import { Mutex } from './app/mutex/Mutex';
import { MutationObserverCreator } from './app/mutationobserver/MutationObserverCreator';
import { Spec } from './app/analysis/Spec';

const visitedPagesGraphMutex: Mutex = new Mutex('visited-pages-graph-mutex');
const interactionsGraphMutex: Mutex = new Mutex('interactions-graph-mutex');

const graphStorage: GraphStorage = new GraphStorage();
const featureStorage: FeatureStorage = new FeatureStorage();
const crawledUrlsStorage: UrlListStorage = new UrlListStorage();
const graphKey = 'graph';
const crawledUrlsKey = 'crawled-urls';
const elementInteractionGraphKey = 'interactions-graph';
const communicationChannel: CommunicationChannel = new ChromeCommunicationChannel();
const featureAnalyzer: FeatureAnalyzer = new FeatureAnalyzer();
const inputInteractor = new InputInteractor();
const buttonInteractor = new ButtonInteractor();
const elementInteracationStorage = new ElementInteractionStorage(document);
const mutationObserver = new MutationObserverCreator(document.body);
const spec: Spec = new Spec('pt-br');

const elementInteractionManager = new ElementInteractionManager(
	inputInteractor,
	buttonInteractor,
	elementInteractionGraphKey,
	graphStorage,
	elementInteracationStorage,
	interactionsGraphMutex
);
const pageUrl: URL = new URL(window.location.href);
const formFiller: FormFiller = new FormFiller(
	elementInteractionManager,
	pageUrl,
	spec
);
const crawler: Crawler = new Crawler(
	document,
	pageUrl,
	communicationChannel,
	graphStorage,
	crawledUrlsStorage,
	featureStorage,
	featureAnalyzer,
	graphKey,
	crawledUrlsKey,
	visitedPagesGraphMutex,
	formFiller,
	mutationObserver
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

function clean(): void {
	graphStorage.remove(graphKey);
	graphStorage.remove(elementInteractionGraphKey);
	crawledUrlsStorage.removeAll('crawled-urls');
	//temporario
	const keys = Object.keys(window.localStorage);
	for (const key of keys) {
		window.localStorage.removeItem(key);
	}
}

function overwriteJavascriptPopups() {
	var script = document.createElement('script');
	script.innerHTML =
		'alert = function(){};confirm = function(){return true;};prompt = function(text,defaultText){return defaultText;}';
	document.body.appendChild(script);
}

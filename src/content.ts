import { AppEvent } from './app/comm/AppEvent';
import { ChromeCommunicationChannel } from './app/comm/ChromeCommunicationChannel';
import { Command } from './app/comm/Command';
import { CommunicationChannel } from './app/comm/CommunicationChannel';
import { Message } from './app/comm/Message';
import { Crawler } from './app/crawler/Crawler';
import { UrlListStorage } from './app/crawler/UrlListStorage';
import { GraphStorage } from './app/graph/GraphStorage';
import { Mutex } from './app/mutex/Mutex';
import { SpecAnalyzer } from './app/analysis/SpecAnalyzer';
import { Spec } from './app/analysis/Spec';
import { FeatureStorage } from './app/crawler/FeatureStorage';

const mu: Mutex = new Mutex('mylock');

const graphStorage: GraphStorage = new GraphStorage();
const featureStorage: FeatureStorage = new FeatureStorage();
const crawledUrlsStorage: UrlListStorage = new UrlListStorage();
const graphKey = 'graph';
const crawledUrlsKey = 'crawled-urls';
const communicationChannel: CommunicationChannel = new ChromeCommunicationChannel();
const specAnalyzer: SpecAnalyzer = new SpecAnalyzer();
const crawler: Crawler = new Crawler(
	communicationChannel,
	graphStorage,
	crawledUrlsStorage,
	featureStorage,
	specAnalyzer,
	graphKey,
	crawledUrlsKey,
	mu
);

communicationChannel.setMessageListener(function (message: Message) {
	if (message.includesAction(Command.CleanGraph)) {
		cleanGraph();
	}
	if (message.includesAction(Command.Crawl)) {
		crawler.crawl();
	}
});

//definir no protocolo de comunicação maneira para que a comunicação da extensão não interfira com a de outras extensões, e vice-versa
communicationChannel.sendMessageToAll(new Message([AppEvent.Loaded]));

function cleanGraph(): void {
	graphStorage.remove(graphKey);
	crawledUrlsStorage.removeAll('crawled-urls');
	//temporario
	const keys = Object.keys(window.localStorage);
	for(const key of keys){
		window.localStorage.removeItem(key);
	}
}

// OUTRAS FUNÇÕES

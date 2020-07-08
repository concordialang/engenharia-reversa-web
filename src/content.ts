import { AppEvent } from './app/comm/AppEvent';
import { ChromeCommunicationChannel } from './app/comm/ChromeCommunicationChannel';
import { Command } from './app/comm/Command';
import { CommunicationChannel } from './app/comm/CommunicationChannel';
import { Message } from './app/comm/Message';
import { Crawler } from './app/crawler/Crawler';
import { UrlListStorage } from './app/crawler/UrlListStorage';
import { GraphStorage } from './app/graph/GraphStorage';
import { Mutex } from './app/mutex/Mutex';

const mu: Mutex = new Mutex('mylock');

let graphStorage: GraphStorage = new GraphStorage();
let crawledUrlsStorage: UrlListStorage = new UrlListStorage();
const graphKey = 'graph';
const crawledUrlsKey = 'crawled-urls';
let communicationChannel: CommunicationChannel = new ChromeCommunicationChannel();
let crawler: Crawler = new Crawler(
	communicationChannel,
	graphStorage,
	crawledUrlsStorage,
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
}

// OUTRAS FUNÇÕES

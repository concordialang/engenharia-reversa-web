import { SpecAnalyzer } from './app/analysis/SpecAnalyzer';
import { AppEvent } from './app/comm/AppEvent';
import { ChromeCommunicationChannel } from './app/comm/ChromeCommunicationChannel';
import { Command } from './app/comm/Command';
import { CommunicationChannel } from './app/comm/CommunicationChannel';
import { Message } from './app/comm/Message';
import { Crawler } from './app/crawler/Crawler';
import { FeatureStorage } from './app/crawler/FeatureStorage';
import { FormFiller } from './app/crawler/FormFiller';
import { UrlListStorage } from './app/crawler/UrlListStorage';
import { GraphStorage } from './app/graph/GraphStorage';
import { Mutex } from './app/mutex/Mutex';

const mutex: Mutex = new Mutex('mylock');

const graphStorage: GraphStorage = new GraphStorage();
const featureStorage: FeatureStorage = new FeatureStorage();
const crawledUrlsStorage: UrlListStorage = new UrlListStorage();
const graphKey = 'graph';
const crawledUrlsKey = 'crawled-urls';
const communicationChannel: CommunicationChannel = new ChromeCommunicationChannel();
const specAnalyzer: SpecAnalyzer = new SpecAnalyzer();
const formFiller: FormFiller = new FormFiller();
const crawler: Crawler = new Crawler(
	document,
	communicationChannel,
	graphStorage,
	crawledUrlsStorage,
	featureStorage,
	specAnalyzer,
	graphKey,
	crawledUrlsKey,
	mutex,
	formFiller
);

communicationChannel.setMessageListener(function (message: Message) {
	if (message.includesAction(Command.CleanGraph)) {
		cleanGraph();
	}
	if (message.includesAction(Command.Crawl)) {
		overwriteJavascriptPopups();
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

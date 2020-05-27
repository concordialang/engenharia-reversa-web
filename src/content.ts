import { GraphStorage } from "./app/graph/GraphStorage";
import { Crawler } from "./app/crawler/Crawler";
import { Mutex } from "./app/mutex/Mutex";
import { UrlListStorage } from "./app/crawler/UrlListStorage";
import { ChromeCommunicationChannel } from "./app/comm/ChromeCommunicationChannel";
import { CommunicationChannel } from "./app/comm/CommunicationChannel";
import { Command } from "./app/comm/Command";
import { Message } from "./app/comm/Message";
import { AppEvent } from "./app/comm/AppEvent";

const mu : Mutex = new Mutex('mylock');

let graphStorage : GraphStorage = new GraphStorage();
let crawledUrlsStorage : UrlListStorage = new UrlListStorage();
const graphKey = "graph";
const crawledUrlsKey = "crawled-urls";
let crawler : Crawler = new Crawler(graphStorage,crawledUrlsStorage,graphKey,crawledUrlsKey,mu);
let communicationChannel : CommunicationChannel = new ChromeCommunicationChannel();

communicationChannel.setMessageListener(function (message : Message) {
    if(message.includesAction(Command.CleanGraph)){
        cleanGraph();
    }
    if(message.includesAction(Command.Crawl)) {
        crawler.crawl();
    }
});

//definir no protocolo de comunicação maneira para que a comunicação da extensão não interfira com a de outras extensões, e vice-versa
communicationChannel.sendMessageToAll(new Message([AppEvent.Loaded]));

function cleanGraph() : void {
    graphStorage.remove(graphKey);
    crawledUrlsStorage.removeAll("crawled-urls");
}

// OUTRAS FUNÇÕES
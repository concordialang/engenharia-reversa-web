import { GraphStorage } from "./app/graph/GraphStorage";
import { Crawler } from "./app/crawler/Crawler";
import { Mutex } from "./app/mutex/Mutex";
import { UrlListStorage } from "./app/crawler/UrlListStorage";
import { ChromeCommunicationChannel } from "./app/comunication-channel/ChromeCommunicationChannel";
import { CommunicationChannel } from "./app/comunication-channel/CommunicationChannel";

const mu : Mutex = new Mutex('mylock');

let graphStorage : GraphStorage = new GraphStorage();
let crawledUrlsStorage : UrlListStorage = new UrlListStorage();
const graphKey = "graph";
const crawledUrlsKey = "crawled-urls";
let crawler : Crawler = new Crawler(graphStorage,crawledUrlsStorage,graphKey,crawledUrlsKey,mu);
let communicationChannel : CommunicationChannel = new ChromeCommunicationChannel();

communicationChannel.setMessageListener(function (request) {
    const actions = request.actions;
    if(actions){
        if(inArray(actions,"clean-graph")){
            cleanGraph();
        }
        if(inArray(actions,"crawl")) {
            crawler.crawl();
        }
    }
});

//definir no protocolo de comunicação maneira para que a comunicação da extensão não interfira com a de outras extensões, e vice-versa
communicationChannel.sendMessageToAll({ action: "loaded" });

function cleanGraph() : void {
    graphStorage.remove(graphKey);
    crawledUrlsStorage.removeAll("crawled-urls");
}

// OUTRAS FUNÇÕES

function inArray(array : Array<any> ,valor : any) : boolean {
    if(array.indexOf(valor) !== -1) return true;
    return false;
}
import { GraphStorage } from "./app/graph/GraphStorage";
import { Crawler } from "./app/Crawler";
import { Mutex } from "./app/mutex/Mutex";
import { UrlListStorage } from "./app/UrlListStorage";
import { ChromeCommunicationChannel } from "./app/comunication-channel/ChromeCommunicationChannel";
import { CommunicationChannel } from "./app/comunication-channel/CommunicationChannel";
const mu : Mutex = new Mutex('mylock');

let graphStorage : GraphStorage = new GraphStorage();
let crawledUrlsStorage : UrlListStorage = new UrlListStorage();
let crawler : Crawler = new Crawler(graphStorage,crawledUrlsStorage,mu);
let communicationChannel : CommunicationChannel = new ChromeCommunicationChannel();

communicationChannel.setMessageListener(function (request) {
    const acoes = request.acoes;
    if(acoes){
        if(inArray(acoes,"clean-graph")){
            cleanGraph();
        }
        if(inArray(acoes,"crawl")) {
            crawler.crawl();
        }
    }
});

communicationChannel.sendMessageToAll({ action: "loaded" });

function cleanGraph() : void {
    graphStorage.remove("grafo");
    crawledUrlsStorage.removeAll("crawled-urls");
}

// OUTRAS FUNÇÕES

function inArray(array : Array<any> ,valor : any) : boolean {
    if(array.indexOf(valor) !== -1) return true;
    return false;
}
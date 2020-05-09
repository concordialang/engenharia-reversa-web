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
        if(estaNoArray(acoes,"limpar-grafo")){
            limparGrafo();
        }
        if(estaNoArray(acoes,"analisar")) {
            crawler.crawl();
        }
    }
});

communicationChannel.sendMessageToAll({ acao: "carregada" });

function limparGrafo() : void {
    graphStorage.remove("grafo");
    crawledUrlsStorage.removeAll("urls-analisadas");
}

// OUTRAS FUNÇÕES

function estaNoArray(array : Array<any> ,valor : any) : boolean {
    if(array.indexOf(valor) !== -1) return true;
    return false;
}
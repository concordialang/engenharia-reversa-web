import { GraphStorage } from "./app/graph/GraphStorage";
import { Crawler } from "./app/Crawler";
import { Mutex } from "./app/mutex/Mutex";
import { UrlListStorage } from "./app/UrlListStorage";
const mu : Mutex = new Mutex('mylock');

let graphStorage = new GraphStorage();
let crawledUrlsStorage = new UrlListStorage();
let crawler : Crawler = new Crawler(graphStorage,crawledUrlsStorage,mu);

chrome.runtime.sendMessage({ acao: "carregada" });

chrome.runtime.onMessage.addListener(function (request) {
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

function limparGrafo() : void{
    graphStorage.remove("grafo");
    crawledUrlsStorage.removeAll("urls-analisadas");
}

// OUTRAS FUNÇÕES

function estaNoArray(array : Array<any> ,valor : any) : boolean{
    if(array.indexOf(valor) !== -1) return true;
    return false;
}
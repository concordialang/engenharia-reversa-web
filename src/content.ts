import { GraphStorage } from "./app/graph/GraphStorage";
import { Crawler } from "./app/Crawler";
import { Mutex } from "./app/mutex/Mutex";
const mu : Mutex = new Mutex('mylock');

let graphStorage = new GraphStorage();
let crawler : Crawler = new Crawler(graphStorage,mu);

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
    window.localStorage.removeItem("urls-analisadas");
    window.localStorage.removeItem("urls-analisadas2");
}

// OUTRAS FUNÇÕES

function estaNoArray(array : Array<any> ,valor : any) : boolean{
    if(array.indexOf(valor) !== -1) return true;
    return false;
}
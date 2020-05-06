import Graph from "graph-data-structure";
import Mutex from "idb-mutex";
const mu : Mutex = new Mutex('mylock');

chrome.runtime.sendMessage({ acao: "carregada" });

let fecharJanela : boolean = false;

chrome.runtime.onMessage.addListener(function (request, sender, callback : CallableFunction) {
    const acoes = request.acoes;
    if(acoes){
        if(estaNoArray(acoes,"limpar-grafo")){
            limparGrafo();
        }
        if(estaNoArray(acoes,"analisar")) {
            
            const urlPagina : URL = new URL(window.location.href);
            adicionarNo(urlPagina);
            const links : HTMLCollectionOf<HTMLAnchorElement> = document.getElementsByTagName('a');
            for (let i : number = 0; i < links.length; i++) {

                const urlEncontrada : URL = new URL(links[i].href);
                adicionarNo(urlEncontrada);
                adicionarLigacao(urlPagina,urlEncontrada);
                if(urlEhDoMesmoHostname(urlEncontrada) && !urlJaFoiAnalisada(urlEncontrada)){
                    adicionarUrlAnalisada(new URL(links[i].href));
                    abrirJanela(links[i].href);
                }
            }
            callback();
            fecharJanela = true;
        }
    }
});

function adicionarUrlAnalisada(url : URL) : void {
    let urlsAnalisadas : Array<String> = obterUrlsAnalisadas();
    urlsAnalisadas.push(url.toString());
    set("urls-analisadas",JSON.stringify(urlsAnalisadas));
}

function get(key : string) : string|null{
    return window.localStorage.getItem(key);
}

function set(key : string,value : string) : void{
    window.localStorage.setItem(key,value);
}

function obterUrlsAnalisadas() : Array<string>{
    let urlsAnalisadas : string|null = get("urls-analisadas");
    if(urlsAnalisadas){
        return JSON.parse(urlsAnalisadas);
    }
    else{
        return [];
    }
}

function urlJaFoiAnalisada(url : URL) : boolean{
    const urlsVisitadas : Array<string> = obterUrlsAnalisadas();
    for(let urlVisitada of urlsVisitadas){
        if(urlsSaoIguais(new URL(urlVisitada),url)){
            return true;
        }
    }
    return false;
}

function urlsSaoIguais(url1 : URL,url2 : URL) : boolean{
    return url1.toString() == url2.toString();
}

//FUNCOES RELACIONADAS A GRAFO

function adicionarNo(url : URL) : void{
    mu.lock().then(() => {
        var grafo = obterGrafo();
        grafo.addNode(url.toString());
        salvarGrafo(grafo);
        return mu.unlock();
    }).then(() => {
        console.log(fecharJanela);
        if(fecharJanela === true) window.close();
    });
}

function adicionarLigacao(url1 : URL,url2 : URL) : void{
    mu.lock().then(() => {
        const grafo : Graph = obterGrafo();
        grafo.addEdge(url1.toString(),url2.toString());
        salvarGrafo(grafo);
        return mu.unlock();
    }).then(() => {
        if(fecharJanela === true) window.close();
    });
}

function obterGrafo() : Graph {
    let json : string|object|null = window.localStorage.getItem("grafo");
    let grafo : Graph = new Graph();
    if(json){
        json = JSON.parse(json);
        grafo = grafo.deserialize(json);
    }
    return grafo;
}

function salvarGrafo(grafo){
    const json = grafo.serialize();
    window.localStorage.setItem("grafo",JSON.stringify(json));
}

function limparGrafo() : void{
    window.localStorage.removeItem("grafo");
    window.localStorage.removeItem("urls-analisadas");
    window.localStorage.removeItem("urls-analisadas2");
}

// OUTRAS FUNÇÕES

function abrirJanela(url : string) : void {
    chrome.runtime.sendMessage({ acao: "abrir-janela", url: url });
}

function estaNoArray(array : Array<any> ,valor : any) : boolean{
    if(array.indexOf(valor) !== -1) return true;
    return false;
}

function urlEhDoMesmoHostname(urlASerVisitada : URL) : boolean{
    const urlDaPagina : URL = new URL(window.location.href);
    return urlDaPagina.hostname === urlASerVisitada.hostname;
}
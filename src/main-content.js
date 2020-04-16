var Graph = require("graph-data-structure");

chrome.extension.sendMessage({ acao: "carregada" });

chrome.extension.onMessage.addListener(function (request, sender, callback) {
    var acoes = request.acoes;
    if(acoes){
        if(estaNoArray(acoes,"limpar-grafo")){
            limparGrafo();
            console.log(window.localStorage.getItem("grafo"));
        }
        if(estaNoArray(acoes,"analisar")) {
            var urlPagina = new URL(window.location.href);
            adicionarUrlAnalisada(urlPagina);
            adicionarNo(urlPagina);

            var links = document.getElementsByTagName('a');
            for (var i = 0; i < links.length; i++) {

                var urlEncontrada = new URL(links[i].href);
                adicionarNo(urlEncontrada);
                adicionarLigacao(urlPagina,urlEncontrada);
                if(urlEhDoMesmoHostname(urlEncontrada) && !urlJaFoiAnalisada(urlEncontrada)){
                    abrirJanela(links[i].href);
                }
            }
            callback();
        }
    }
});

function adicionarUrlAnalisada(url){
   var urlsAnalisadas = obterUrlsAnalisadas();
   urlsAnalisadas.push(url.toString());
   window.localStorage.setItem("urls-analisadas",JSON.stringify(urlsAnalisadas));
}

function obterUrlsAnalisadas(){
    var urlsAnalisadas = window.localStorage.getItem("urls-analisadas");
    if(urlsAnalisadas){
        return JSON.parse(urlsAnalisadas);
    }
    else{
        return [];
    }

}

function urlJaFoiAnalisada(url){
    var urlsVisitadas = obterUrlsAnalisadas();
    for(var urlVisitada of urlsVisitadas){
        if(urlsSaoIguais(new URL(urlVisitada),url)){
            return true;
        }

    }
    return false;
}

function urlsSaoIguais(url1,url2){
    return url1.toString() == url2.toString();
}

//FUNCOES RELACIONADAS A GRAFO

function adicionarNo(url){
    var grafo = obterGrafo();
    grafo.addNode(url.toString());
    salvarGrafo(grafo);
}

function adicionarLigacao(url1,url2){
    var grafo = obterGrafo();
    grafo.addEdge(url1.toString(),url2.toString());
    salvarGrafo(grafo);
}

function obterGrafo(){
    var json = window.localStorage.getItem("grafo");
    var grafo = new Graph();
    if(json){
        json = JSON.parse(json);
        grafo = grafo.deserialize(json);
    }
    return grafo;
}

function salvarGrafo(grafo){
    var json = grafo.serialize();
    window.localStorage.setItem("grafo",JSON.stringify(json));
}

function limparGrafo(){
    window.localStorage.removeItem("grafo");
    window.localStorage.removeItem("urls-analisadas")
}

// OUTRAS FUNÇÕES

function abrirJanela(url) {
    chrome.extension.sendMessage({ acao: "abrir-janela", url: url });
}

function estaNoArray(array,valor){
    if(array.indexOf(valor) !== -1) return true;
    return false;
}

function urlEhDoMesmoHostname(urlASerVisitada){
    var urlDaPagina = new URL(window.location.href);
    return urlDaPagina.hostname === urlASerVisitada.hostname;
}
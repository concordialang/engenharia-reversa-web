// const script = document.createElement('script');
// script.setAttribute("type", "module");
// script.setAttribute("src", chrome.extension.getURL('main.js'));
// const head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
// head.insertBefore(script, head.lastChild);

chrome.extension.sendMessage({acao:"carregada"});

import Graph from "graph-data-structure";

chrome.extension.onMessage.addListener(function(request: any, sender: any, callback: any) {
    console.log(request);
    if (request.acao == "analisar") {
        var links = document.getElementsByTagName( 'a' );
        for (var i = 0; i < links.length; i++ ) {
            abrirJanela(links[i].href);
        }
        callback();
    }
});

var graph = Graph();
console.log(graph);

function abrirJanela(url:string){
    console.log(url);
    chrome.extension.sendMessage({acao:"abrir-janela",url:url});
}
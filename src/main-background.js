"use strict";
var Graph = require("graph-data-structure");
var bkg = chrome.extension.getBackgroundPage();
//RECURSOS USADOS POR TODAS THREADS
var urlInicial;
var urlJaAbertas = [];
var tabsAbertasPelaExtensao = [];
var grafo;

chrome.browserAction.onClicked.addListener(function (tab) {
    grafo = new Graph();
    urlInicial = new URL(tab.url);
    bkg.console.log(tab);
    urlJaAbertas.push(tab.url);
    grafo.addNode(urlInicial.toString());
    tabsAbertasPelaExtensao.push(tab.id);
    mandarAnalisar(tab);
});

chrome.extension.onMessage.addListener(function (request, sender) {
    if (request.acao == 'abrir-janela') {
        grafo.addEdge(sender.url,request.url)
        abrirJanela(new URL(request.url));
        bkg.console.log(urlJaAbertas);
    }
});

chrome.extension.onMessage.addListener(function (request, sender) {
    if (request.acao == 'carregada') {
        if (tabsAbertasPelaExtensao.indexOf(sender.tab.id) > -1) {
            bkg.console.log("foi aberta pela extensao");
            mandarAnalisar(sender.tab);
        }
    }
});

function mandarAnalisar(tab) {
    chrome.tabs.sendMessage(tab.id, { acao: "analisar" }, null, function () {
        //chrome.tabs.remove(tab.id);
        removerTabId(tab.id);
        bkg.console.log(tabsAbertasPelaExtensao);
        bkg.console.log(grafo.serialize());
        if (tabsAbertasPelaExtensao.length == 0) {
            urlJaAbertas = [];
        }
        bkg.console.log(urlJaAbertas);
    });
}

function abrirJanela(url) {
    if (urlJaAbertas.indexOf(url.toString()) > -1 || url.hostname != urlInicial.hostname) {
        return false;
    }
    bkg.console.log(url);
    urlJaAbertas.push(url.toString());
    grafo.addNode(url.toString());
    chrome.tabs.create({
        url: url.toString()
    }, function (tab) {
        tabsAbertasPelaExtensao.push(tab.id);
    });
}

//teoricamente pode dar problema de concorrência
function removerTabId(idTab) {
    const index = tabsAbertasPelaExtensao.indexOf(idTab);
    if (index > -1) {
        tabsAbertasPelaExtensao.splice(index, 1);
    }
}
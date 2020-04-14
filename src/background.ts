var bkg = chrome.extension.getBackgroundPage();

//RECURSOS USADOS POR TODAS THREADS
var urlInicial : String;

var urlJaAbertas : Array<String> = [];
var tabsAbertasPelaExtensao : Array<Number> = [];

chrome.browserAction.onClicked.addListener(function(tab : chrome.tabs.Tab) { 
    urlInicial = new URL(tab.url);
    bkg.console.log(tab);
    urlJaAbertas.push(tab.url);
    tabsAbertasPelaExtensao.push(tab.id);
    mandarAnalisar(tab);
});

chrome.extension.onMessage.addListener(function(request : any){
    if(request.acao == 'abrir-janela'){
        abrirJanela(new URL(request.url));
        bkg.console.log(urlJaAbertas);
    }
});

chrome.extension.onMessage.addListener(function(request : any, sender : any){
    if(request.acao == 'carregada'){
        if(tabsAbertasPelaExtensao.indexOf(sender.tab.id) > -1){
            bkg.console.log("foi aberta pela extensao");
            mandarAnalisar(sender.tab);
        }
        
    }
});

function mandarAnalisar(tab : chrome.tabs.Tab){
    chrome.tabs.sendMessage(tab.id, {acao: "analisar"},null, function() {
        chrome.tabs.remove(tab.id);
        removerTabId(tab.id);
        bkg.console.log(tabsAbertasPelaExtensao);
        if(tabsAbertasPelaExtensao.length == 0){
            urlJaAbertas = [];
        }
        bkg.console.log(urlJaAbertas);
        
    });
}

function abrirJanela(url : URL){
    if(urlJaAbertas.indexOf(url.toString()) > -1 || url.hostname != urlInicial.hostname){
        return false;
    }
    bkg.console.log(url);
    urlJaAbertas.push(url.toString());
    chrome.tabs.create({
        url: url.toString()
      }, function(tab : chrome.tabs.Tab) {
        tabsAbertasPelaExtensao.push(tab.id);
      });
}

//teoricamente pode dar problema de concorrência
function removerTabId(idTab){
    const index = tabsAbertasPelaExtensao.indexOf(idTab);
    if (index > -1) {
        tabsAbertasPelaExtensao.splice(index, 1);
    }
}
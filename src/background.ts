//const bkg : Window | null = chrome.extension.getBackgroundPage();

let tabsAbertasPelaExtensao : Array<Number | undefined> = [];

chrome.browserAction.onClicked.addListener(function (tab : chrome.tabs.Tab) {
    tabsAbertasPelaExtensao.push(tab.id);
    mandarAnalisar(tab, true);
});

chrome.runtime.onMessage.addListener(function (request, sender) {
    if (request.acao == 'abrir-janela') {
        abrirJanela(new URL(request.url),function(){});
        //bkg.console.log(urlJaAbertas);
    }
});

chrome.runtime.onMessage.addListener(function (request, sender) {
    if (request.acao == 'carregada') {
        if (tabsAbertasPelaExtensao.indexOf(sender?.tab?.id) > -1) {
           // bkg.console.log("foi aberta pela extensao");
            mandarAnalisar(sender.tab);
        }
    }
});

function mandarAnalisar(tab : chrome.tabs.Tab | undefined, primeiraAnalise : Boolean = false) {

    let acoes : Array<String> = ["analisar"];
    if(primeiraAnalise){
        acoes.push("limpar-grafo");
    }
    let idTab = tab?.id ?? 0;
    let options = new Object();
    chrome.tabs.sendMessage(idTab, { acoes: acoes }, options, function () {
        //chrome.tabs.remove(tab.id);
        removerTabId(tab?.id);
    });
}

function abrirJanela(url : URL, funcao : CallableFunction) {
    chrome.tabs.create({
        url: url.toString()
    }, function (tab : chrome.tabs.Tab) {
        tabsAbertasPelaExtensao.push(tab.id);
        //tab.onLoad = funcao;
    });
}

//teoricamente pode dar problema de concorrência
function removerTabId(idTab : Number | undefined) {
    const index = tabsAbertasPelaExtensao.indexOf(idTab);
    if (index > -1) {
        tabsAbertasPelaExtensao.splice(index, 1);
    }
}
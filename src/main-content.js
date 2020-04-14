chrome.extension.sendMessage({ acao: "carregada" });

chrome.extension.onMessage.addListener(function (request, sender, callback) {
    if (request.acao == "analisar") {
        var links = document.getElementsByTagName('a');
        for (var i = 0; i < links.length; i++) {
            abrirJanela(links[i].href);
        }
        callback();
    }
});

function abrirJanela(url) {
    chrome.extension.sendMessage({ acao: "abrir-janela", url: url });
}
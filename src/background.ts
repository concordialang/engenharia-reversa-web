//const bkg : Window | null = chrome.extension.getBackgroundPage();

import { ExtensionManager } from "./app/ExtensionManager";
import { ChromeExtension } from "./app/ChromeExtension";

let extension = new ChromeExtension();
let manager = new ExtensionManager(extension);

chrome.browserAction.onClicked.addListener(function (tab : chrome.tabs.Tab) {
    manager.addOpenedTab(tab);
    manager.analyzeTab(tab,true);
});

chrome.runtime.onMessage.addListener(function (request) {
    if (request.acao == 'abrir-janela') {
        manager.openNewTab(new URL(request.url));
    }
});

chrome.runtime.onMessage.addListener(function (request, sender) {
    if (sender.tab && request.acao == 'carregada') {
        if (manager.tabWasOpenedByExtension(sender.tab)) {
           manager.analyzeTab(sender.tab);
        }
    }
});
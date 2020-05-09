//const bkg : Window | null = chrome.extension.getBackgroundPage();

import { ExtensionManager } from "./app/ExtensionManager";
import { ChromeExtension } from "./app/extension/ChromeExtension";
import { Extension } from "./app/extension/Extension";
import { CommunicationChannel } from "./app/comunication-channel/CommunicationChannel";
import { ChromeCommunicationChannel } from "./app/comunication-channel/ChromeCommunicationChannel";

let extension : Extension = new ChromeExtension();
let manager : ExtensionManager = new ExtensionManager(extension);
let communicationChannel : CommunicationChannel = new ChromeCommunicationChannel();

chrome.browserAction.onClicked.addListener(function (tab : chrome.tabs.Tab) {
    manager.addOpenedTab(tab);
    manager.analyzeTab(tab,true);
});

//abstrair sender
communicationChannel.setMessageListener(function (request, sender) {
    if (request.acao == 'abrir-janela') {
        manager.openNewTab(new URL(request.url));
    }
    else if (sender.tab && request.acao == 'carregada') {
        if (manager.tabWasOpenedByExtension(sender.tab)) {
           manager.analyzeTab(sender.tab);
        }
    }
});
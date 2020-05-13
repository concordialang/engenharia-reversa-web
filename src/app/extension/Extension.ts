export interface Extension {

    // substituir {} por classe que represente mensagem
    sendMessageToTab(tabId : string, message : {}) : Promise<void>;

    //abstrair chrome.tabs.Tab
    openNewTab(url : URL) : Promise<chrome.tabs.Tab>;

    setBrowserActionListener(action : string, callback : CallableFunction) : void;

}
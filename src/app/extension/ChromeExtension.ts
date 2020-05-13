import { Extension } from "./Extension";

export class ChromeExtension implements Extension {

    // substituir {} por classe que represente mensagem
    public sendMessageToTab(tabId : string, message : {}) : Promise<void> {
        return new Promise(function (resolve,reject) {
            const options = new Object();
            chrome.tabs.sendMessage(Number(tabId), message, options, function () {
                resolve();
            });
        });

    }

    //abstrair chrome.tabs.Tab
    public openNewTab(url : URL) : Promise<chrome.tabs.Tab> {
        return new Promise(function (resolve,reject) {
            chrome.tabs.create({
                url: url.toString()
            }, function (tab : chrome.tabs.Tab) {
                resolve(tab);
            });
        });
    }

    public setBrowserActionListener(action : string, callback : CallableFunction) : void{
        chrome.browserAction[action].addListener(callback);
    }

    

}
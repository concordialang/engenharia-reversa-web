import { Extension } from "./Extension";
import { Tab } from "./Tab";
import { ChromeTab } from "./ChromeTab";

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

    public openNewTab(url : URL) : Promise<Tab> {
        return new Promise(function (resolve,reject) {
            chrome.tabs.create({
                url: url.toString()
            }, function (tab : chrome.tabs.Tab) {
                if(tab && tab.id){
                    resolve(new ChromeTab(tab.id.toString()));
                }
                else{
                    reject();
                }
            });
        });
    }

    public setBrowserActionListener(action : string, callback : CallableFunction) : void{
        chrome.browserAction[action].addListener(callback);
    }

    

}
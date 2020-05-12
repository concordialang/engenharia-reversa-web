import { Extension } from "./Extension";

export class ChromeExtension implements Extension {

    public sendMessageToTab(tabId : string, message : any) : Promise<any> {
        return new Promise(function (resolve,reject) {
            const options = new Object();
            chrome.tabs.sendMessage(Number(tabId), message, options, function () {
                resolve();
            });
        });

    }

    public openNewTab(url : URL) : Promise<any> {
        return new Promise(function (resolve,reject) {
            chrome.tabs.create({
                url: url.toString()
            }, function (tab : chrome.tabs.Tab) {
                resolve(tab);
            });
        });
    }

    public setBrowserActionListener(action : string, callback : any) : void{
        chrome.browserAction[action].addListener(callback);
    }

    

}
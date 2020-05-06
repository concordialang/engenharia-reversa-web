import { Browser } from "./Browser";

export class ChromeBrowser implements Browser {

    public sendMessageToTab(tabId : string, message : any) : Promise<any> {
        this.log(tabId);
        this.log(message);
        return new Promise(function (resolve,reject) {
            const options = new Object();
            chrome.tabs.sendMessage(Number(tabId), message, options, function () {
                resolve();
            });
        });

    }

    public openNewTab(url : URL) : Promise<any> {
        this.log(url);
        return new Promise(function (resolve,reject) {
            chrome.tabs.create({
                url: url.toString()
            }, function (tab : chrome.tabs.Tab) {
                resolve(tab);
            });
        });
    }

    //temporaria
    private log(obj : any) {
        const bkg : Window | null = chrome.extension.getBackgroundPage();
        bkg?.console.log(obj);
    }

}
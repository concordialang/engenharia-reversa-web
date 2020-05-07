import { Extension } from "./Extension";

export class ExtensionManager {

    //mudar tipo de chrome.tabs.Tab para uma classe que represente Tab de maneira mais genérica
    private openedTabs : Array<chrome.tabs.Tab>;
    private extension : Extension;

    constructor(extension : Extension) {
        this.openedTabs = [];
        this.extension = extension;
    }

    public openNewTab(url : URL) : void {
        const promise : Promise<any> = this.extension.openNewTab(url);
        const _this = this;
        promise.then(function(tab : chrome.tabs.Tab){
            _this.openedTabs.push(tab);
        });
    }

    //temporaria
    public analyzeTab(tab : chrome.tabs.Tab, firstAnalysis : Boolean = false) {
        let acoes : Array<String> = ["analisar"];
        if(firstAnalysis){
            acoes.push("limpar-grafo");
        }
        let idTab = tab?.id ?? 0;
        const promise : Promise<any> = this.extension.sendMessageToTab(idTab.toString(),{ acoes: acoes });
        const _this = this;
        promise.then(function(){
            _this.removeTab(tab);
        });
    }

    //temporaria
    public addOpenedTab(tab : chrome.tabs.Tab) {
        this.openedTabs.push(tab);
    }

    //temporaria
    //teoricamente pode dar problema de concorrência
    private removeTab(tab : chrome.tabs.Tab) {
        for(let i : number = 0;i< this.openedTabs.length;i++){
            let openedTab : chrome.tabs.Tab = this.openedTabs[i];
            if(openedTab.id == tab.id){
                this.openedTabs.splice(i, 1);
            }
        }
    }

    //temporaria
    public tabWasOpenedByExtension(tab : chrome.tabs.Tab) {
        for(let i : number = 0;i< this.openedTabs.length;i++){
            let openedTab : chrome.tabs.Tab = this.openedTabs[i];
            if(openedTab.id == tab.id){
                return true;
            }
        }
        return false;
    }

    //temporaria
    private log(obj : any) {
        const bkg : Window | null = chrome.extension.getBackgroundPage();
        bkg?.console.log(obj);
    }

}
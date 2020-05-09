import { Extension } from "./extension/Extension";
import { CommunicationChannel } from "./comunication-channel/CommunicationChannel";

export class ExtensionManager {

    //mudar tipo de chrome.tabs.Tab para uma classe que represente Tab de maneira mais genérica
    private openedTabs : Array<chrome.tabs.Tab>;
    private extension : Extension;
    private communicationChannel : CommunicationChannel;

    constructor(extension : Extension, communicationChannel: CommunicationChannel) {
        this.openedTabs = [];
        this.extension = extension;
        this.communicationChannel = communicationChannel;
    }

    public setup() : void {

        //abstrair chrome.tabs.Tab
        let _this = this;
        this.extension.setBrowserActionListener('onClicked',function (tab : chrome.tabs.Tab) {
            _this.addOpenedTab(tab);
            _this.sendOrderToCrawlTab(tab,true);
        });

        //abstrair sender/request
        this.communicationChannel.setMessageListener(function (request, sender) {
            if (request.acao == 'abrir-janela') {
                _this.openNewTab(new URL(request.url));
            }
            else if (sender.tab && request.acao == 'carregada') {
                if (_this.tabWasOpenedByThisExtension(sender.tab)) {
                    _this.sendOrderToCrawlTab(sender.tab);
                }
            }
        });

    }

    public openNewTab(url : URL) : void {
        const promise : Promise<any> = this.extension.openNewTab(url);
        const _this = this;
        promise.then(function(tab : chrome.tabs.Tab){
            _this.openedTabs.push(tab);
        });
    }

    //temporaria
    public sendOrderToCrawlTab(tab : chrome.tabs.Tab, firstCrawl : Boolean = false) {
        let acoes : Array<String> = ["analisar"];
        if(firstCrawl){
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
    public tabWasOpenedByThisExtension(tab : chrome.tabs.Tab) {
        for(let i : number = 0;i< this.openedTabs.length;i++){
            let openedTab : chrome.tabs.Tab = this.openedTabs[i];
            if(openedTab.id == tab.id){
                return true;
            }
        }
        return false;
    }

}
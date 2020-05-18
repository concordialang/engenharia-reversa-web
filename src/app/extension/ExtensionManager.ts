import { Extension } from "./Extension";
import { CommunicationChannel } from "../comm/CommunicationChannel";
import { Tab } from "./Tab";
import { ExtensionBrowserAction } from "./ExtensionBrowserAction";

export class ExtensionManager {

    private openedTabs : Array<Tab>;
    private extension : Extension;
    private communicationChannel : CommunicationChannel;

    constructor(extension : Extension, communicationChannel: CommunicationChannel) {
        this.openedTabs = [];
        this.extension = extension;
        this.communicationChannel = communicationChannel;
    }

    public setup() : void {

        let _this = this;
        this.extension.setBrowserActionListener(ExtensionBrowserAction.ExtensionIconClicked,function (tab : Tab) {
            _this.addOpenedTab(tab);
            _this.sendOrderToCrawlTab(tab,true);
        });

        //abstrair sender/request
        //definir constante para acoes / criar protocolo
        this.communicationChannel.setMessageListener(function (request, sender) {
            if (request.action == 'open-tab') {
                _this.openNewTab(new URL(request.url));
            }
            else if (sender.tab && sender.tab.id && request.action == 'loaded') {
                if (_this.tabWasOpenedByThisExtension(new Tab(sender.tab.id.toString()))) {
                    _this.sendOrderToCrawlTab(new Tab(sender.tab.id.toString()));
                }
            }
        });

    }

    public openNewTab(url : URL) : void {
        const promise : Promise<Tab> = this.extension.openNewTab(url);
        const _this = this;
        promise.then(function(tab : Tab){
            _this.openedTabs.push(tab);
        });
    }

    //temporaria
    public sendOrderToCrawlTab(tab : Tab, firstCrawl : Boolean = false) {
        let actions : Array<String> = ["crawl"];
        if(firstCrawl){
            actions.push("clean-graph");
        }
        let idTab = tab.getId() ?? 0;
        const promise : Promise<void> = this.extension.sendMessageToTab(idTab.toString(),{ actions: actions });
        const _this = this;
        promise.then(function(){
            _this.removeTab(tab);
        });
    }

    //temporaria
    public addOpenedTab(tab : Tab) {
        this.openedTabs.push(tab);
    }

    //temporaria
    //teoricamente pode dar problema de concorrência
    private removeTab(tab : Tab) {
        for(let i : number = 0;i< this.openedTabs.length;i++){
            let openedTab : Tab = this.openedTabs[i];
            if(openedTab.getId() == tab.getId()){
                this.openedTabs.splice(i, 1);
            }
        }
    }

    //temporaria
    public tabWasOpenedByThisExtension(tab : Tab) {
        for(let i : number = 0;i< this.openedTabs.length;i++){
            let openedTab : Tab = this.openedTabs[i];
            if(openedTab.getId() == tab.getId()){
                return true;
            }
        }
        return false;
    }

}
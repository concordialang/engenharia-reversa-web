import { Extension } from "./Extension";
import { CommunicationChannel } from "../comm/CommunicationChannel";
import { Tab } from "./Tab";
import { ExtensionBrowserAction } from "./ExtensionBrowserAction";
import { Command } from "../comm/Command";
import { Message } from "../comm/Message";
import { AppEvent } from "../comm/AppEvent";

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

        this.communicationChannel.setMessageListener(function (message : Message, sender? : Tab) {
            if (message.includesAction(Command.OpenNewTab)) {
                const extra  = message.getExtra();
                if(extra && extra.url)
                    _this.openNewTab(new URL(extra.url));
            }
            else if (sender instanceof Tab && sender.getId() && message.includesAction(AppEvent.Loaded)) {
                if (_this.tabWasOpenedByThisExtension(sender)){
                    _this.sendOrderToCrawlTab(sender);
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
        let commands : Array<Command> = [Command.Crawl];
        if(firstCrawl){
            commands.push(Command.CleanGraph);
        }
        let idTab = tab.getId() ?? 0;
        const promise : Promise<void> = this.extension.sendMessageToTab(idTab.toString(),new Message(commands));
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